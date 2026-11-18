(() => {
  const buttonContainer = document.getElementById('googleSignInButton');
  if (!buttonContainer) return;

  const mode = window.location.pathname.toLowerCase().endsWith('register.html') ? 'register' : 'login';
  const authAlert = document.getElementById('authAlert');
  const setupNotice = document.getElementById('googleAuthSetupNotice');

  function showAuthError(message) {
    if (authAlert) {
      authAlert.textContent = message;
      authAlert.style.display = 'block';
    }
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function makeNonce() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const nonce = btoa(String.fromCharCode(...bytes));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
    return { nonce, hashedNonce: bytesToHex(new Uint8Array(digest)) };
  }

  async function completeGoogleSignIn(response, nonce) {
    const terms = document.getElementById('agreeTerms');
    if (terms && !terms.checked) {
      showAuthError('Please agree to the Terms of Service and equipment service records access to continue.');
      return;
    }

    buttonContainer.style.opacity = '0.65';
    buttonContainer.style.pointerEvents = 'none';
    if (authAlert) {
      authAlert.style.display = 'none';
      authAlert.textContent = '';
    }

    try {
      if (!window.supabaseClient) throw new Error('Authentication service is unavailable. Please try again later.');

      const { data, error } = await window.supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce
      });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('Google sign-in did not return a user account.');

      let profile = null;
      let profileError = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const result = await window.supabaseClient
          .from('profiles')
          .select('id, email, full_name, company, phone, role, pref_sms, pref_email, pref_warranty')
          .eq('id', user.id)
          .maybeSingle();
        profile = result.data;
        profileError = result.error;
        if (profile || profileError) break;
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      if (profileError) throw new Error(`Unable to load your account profile: ${profileError.message}`);
      if (!profile) throw new Error('Your account was authenticated, but its profile is not ready. Please try again shortly.');

      const name = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
      const role = profile.role || 'customer';
      if (typeof BD22_DB !== 'undefined') {
        BD22_DB.clearUserData();
        BD22_DB.set('currentUser', {
          id: user.id,
          email: user.email,
          role,
          full_name: name,
          name,
          company: profile.company || 'Facility Operations',
          phone: profile.phone || '',
          pref_sms: profile.pref_sms ?? true,
          pref_email: profile.pref_email ?? true,
          pref_warranty: profile.pref_warranty ?? true
        });
      }

      localStorage.setItem('bd22_role', role);
      window.location.replace(role === 'admin' ? 'admin.html' : 'customer-portal.html');
    } catch (error) {
      console.error('Google authentication error:', error);
      showAuthError(error.message || 'Google sign-in failed. Please try again.');
      buttonContainer.style.opacity = '';
      buttonContainer.style.pointerEvents = '';
    }
  }

  async function initializeGoogleButton() {
    const clientId = typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.googleClientId : '';
    if (!clientId || clientId.startsWith('YOUR_')) {
      if (setupNotice) {
        setupNotice.textContent = 'Google sign-in is not configured yet. Add the Google Web Client ID to js/supabase-config.js and enable Google in Supabase Auth.';
        setupNotice.style.display = 'block';
      }
      return;
    }

    try {
      const { nonce, hashedNonce } = await makeNonce();
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        callback: response => completeGoogleSignIn(response, nonce),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      window.google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        width: Math.min(440, Math.max(240, buttonContainer.parentElement.clientWidth))
      });
    } catch (error) {
      console.error('Google Identity Services initialization failed:', error);
      showAuthError('Google sign-in could not be initialized. Please use email and password or try again later.');
    }
  }

  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.async = true;
  gisScript.defer = true;
  gisScript.onload = initializeGoogleButton;
  gisScript.onerror = () => showAuthError('Google sign-in could not be loaded. Please check your network connection.');
  document.head.appendChild(gisScript);
})();
