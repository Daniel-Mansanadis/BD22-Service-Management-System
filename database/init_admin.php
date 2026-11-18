<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$pdo = getDbConnection();

$adminEmail = $argv[1] ?? (getenv('INIT_ADMIN_EMAIL') ?: 'admin@bd22fire.com');
$adminPass  = $argv[2] ?? (getenv('INIT_ADMIN_PASSWORD') ?: '');
$adminName  = $argv[3] ?? (getenv('INIT_ADMIN_NAME') ?: 'BD22 Admin');

$customerEmail = getenv('INIT_SAMPLE_CUSTOMER_EMAIL') ?: '';
$customerPass  = getenv('INIT_SAMPLE_CUSTOMER_PASSWORD') ?: '';
$customerName  = getenv('INIT_SAMPLE_CUSTOMER_NAME') ?: 'Sample Customer';
$customerComp  = getenv('INIT_SAMPLE_CUSTOMER_COMPANY') ?: 'Sample Company';
$customerPhone = getenv('INIT_SAMPLE_CUSTOMER_PHONE') ?: '';

echo "=== BD22 Fire System Account Provisioning ===" . PHP_EOL;

// 1. Provision Admin Account
$stmt = $pdo->prepare('SELECT id, email, password_hash FROM users WHERE role = "admin" LIMIT 1');
$stmt->execute();
$existingAdmin = $stmt->fetch();

if ($existingAdmin) {
    echo "[INFO] Admin account already exists: " . $existingAdmin['email'] . PHP_EOL;
    if ($existingAdmin['password_hash'] === '!disabled!') {
        if ($adminPass === '') {
            fwrite(STDERR, "Set INIT_ADMIN_PASSWORD to enable the seeded admin account." . PHP_EOL);
            exit(1);
        }

        $stmt = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $stmt->execute([
            ':hash' => password_hash($adminPass, PASSWORD_DEFAULT),
            ':id' => $existingAdmin['id']
        ]);
        echo "[SUCCESS] Enabled the seeded admin account with the configured password." . PHP_EOL;
    }
} else {
    if ($adminPass === '') {
        fwrite(STDERR, "Set INIT_ADMIN_PASSWORD in .env or pass the admin password as the second CLI argument." . PHP_EOL);
        exit(1);
    }

    $hash = password_hash($adminPass, PASSWORD_DEFAULT);
    $parts = explode(' ', $adminName, 2);
    $firstName = $parts[0] ?? 'BD22';
    $lastName = $parts[1] ?? 'Admin';

    $insertAdmin = $pdo->prepare('
        INSERT INTO users (role, email, password_hash, full_name, first_name, last_name, company, phone)
        VALUES ("admin", :email, :hash, :name, :fname, :lname, "BD22 Fire System & Builders Inc.", "+63 917 555 8899")
    ');
    $insertAdmin->execute([
        ':email' => $adminEmail,
        ':hash'  => $hash,
        ':name'  => $adminName,
        ':fname' => $firstName,
        ':lname' => $lastName
    ]);
    echo "[SUCCESS] Created Administrator Account:" . PHP_EOL;
    echo "  Email:    " . $adminEmail . PHP_EOL;
    echo "  Name:     " . $adminName . PHP_EOL;
}

if ($customerEmail !== '' && $customerPass !== '') {
    // 2. Provision Initial Customer Account
    $custCheck = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = :email LIMIT 1');
    $custCheck->execute([':email' => $customerEmail]);
    $existingCust = $custCheck->fetch();
    
    $customerId = null;
    if ($existingCust) {
        $customerId = (int)$existingCust['id'];
        if ($existingCust['password_hash'] === '!disabled!') {
            $custUpdate = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
            $custUpdate->execute([
                ':hash' => password_hash($customerPass, PASSWORD_DEFAULT),
                ':id' => $customerId
            ]);
        }
        echo "[INFO] Sample Customer account already exists: " . $customerEmail . PHP_EOL;
    } else {
        $custHash = password_hash($customerPass, PASSWORD_DEFAULT);
        $insertCust = $pdo->prepare('
            INSERT INTO users (role, email, password_hash, full_name, first_name, last_name, company, phone, pref_sms, pref_email, pref_warranty)
            VALUES ("customer", :email, :hash, :name, "Sample", "Customer", :comp, :phone, 1, 1, 1)
        ');
        $insertCust->execute([
            ':email' => $customerEmail,
            ':hash'  => $custHash,
            ':name'  => $customerName,
            ':comp'  => $customerComp,
            ':phone' => $customerPhone
        ]);
        $customerId = (int)$pdo->lastInsertId();
        echo "[SUCCESS] Created Sample Customer Account:" . PHP_EOL;
        echo "  Email:    " . $customerEmail . PHP_EOL;
        echo "  Name:     " . $customerName . PHP_EOL;
        echo "  Company:  " . $customerComp . PHP_EOL;
    }
    
    // 3. Seed initial linked customer records if they don't exist
    if ($customerId) {
        // Inquiries
        $inqCount = $pdo->query('SELECT COUNT(*) FROM inquiries')->fetchColumn();
        if ($inqCount == 0) {
            $inqStmt = $pdo->prepare('
                INSERT INTO inquiries (reference_no, user_id, customer_name, email, phone, service_name, message, status, assigned_staff, tracking_note)
                VALUES (:ref, :uid, :name, :email, "+63 917 123 4567", :srv, :msg, :status, :staff, :note)
            ');
            $initialInquiries = [
                ['INQ-2026-0001', 'Annual Fire Alarm Inspection', 'Schedule annual fire alarm panel diagnostic and detector test.', 'Pending Review', 'Engr. D. Santos', 'Site visit scheduled for technical assessment.'],
                ['INQ-2026-0002', 'Clean Agent FM-200 Suppression', 'Design review for server room gas flooding system.', 'Scheduled', 'Engr. M. Cruz', 'Awaiting client architectural floor plans.'],
                ['INQ-2026-0003', 'Sprinkler Retrofit', 'Replace outdated upright sprinkler heads in warehouse section A.', 'Completed', 'Engr. R. Valdez', 'Inspection and hydro testing finished.']
            ];
            foreach ($initialInquiries as $inq) {
                $inqStmt->execute([
                    ':ref'    => $inq[0],
                    ':uid'    => $customerId,
                    ':name'   => $customerName,
                    ':email'  => $customerEmail,
                    ':srv'    => $inq[1],
                    ':msg'    => $inq[2],
                    ':status' => $inq[3],
                    ':staff'  => $inq[4],
                    ':note'   => $inq[5]
                ]);
            }
            echo "[SUCCESS] Seeded initial customer inquiries." . PHP_EOL;
        }
    
        // Projects
        $projCount = $pdo->query('SELECT COUNT(*) FROM projects')->fetchColumn();
        if ($projCount == 0) {
            $projStmt = $pdo->prepare('
                INSERT INTO projects (project_code, user_id, name, customer_name, assigned_team, progress, target_date, status, milestones, description)
                VALUES (:code, :uid, :name, :cust, :team, :prog, :target, :status, :milestones, :desc)
            ');
            $initialProjects = [
                ['proj-1', 'Arden Plant 1 Sprinkler Retrofit', $customerComp, 'Team Alpha (Engr. Santos)', 85, '2026-11-30', 'In Progress', "Phase 1: Hydraulic calculation (Done)\nPhase 2: Main riser piping installation (Done)\nPhase 3: Branch line pressure testing (In Progress)\nPhase 4: BFP FSIC Final Audit (Pending)", 'Complete retrofit of 450 pendent sprinkler heads across manufacturing hall A.'],
            ];
            foreach ($initialProjects as $p) {
                $projStmt->execute([
                    ':code'       => $p[0],
                    ':uid'        => $customerId,
                    ':name'       => $p[1],
                    ':cust'       => $p[2],
                    ':team'       => $p[3],
                    ':prog'       => $p[4],
                    ':target'     => $p[5],
                    ':status'     => $p[6],
                    ':milestones' => $p[7],
                    ':desc'       => $p[8]
                ]);
            }
            echo "[SUCCESS] Seeded initial projects." . PHP_EOL;
        }
    
        // Payments / Invoices
        $payCount = $pdo->query('SELECT COUNT(*) FROM payments')->fetchColumn();
        if ($payCount == 0) {
            $payStmt = $pdo->prepare('
                INSERT INTO payments (invoice_no, user_id, project_name, customer_name, amount, due_date, status, assigned_staff)
                VALUES (:inv, :uid, :pname, :cname, :amt, :due, :status, :staff)
            ');
            $initialPayments = [
                ['INV-2026-001', 'Arden Plant 1 Sprinkler Retrofit', $customerComp, 48500.00, '2026-10-30', 'Partial', 'Accounting'],
                ['INV-2026-002', 'DataVault FM-200 Clean Agent Flooding', $customerComp, 62000.00, '2026-10-15', 'Overdue', 'Accounting'],
                ['INV-2026-003', 'Apex Tower B Standpipe & Hose Stations', $customerComp, 125000.00, '2026-08-30', 'Paid', 'Accounting']
            ];
            foreach ($initialPayments as $pay) {
                $payStmt->execute([
                    ':inv'    => $pay[0],
                    ':uid'    => $customerId,
                    ':pname'  => $pay[1],
                    ':cname'  => $pay[2],
                    ':amt'    => $pay[3],
                    ':due'    => $pay[4],
                    ':status' => $pay[5],
                    ':staff'  => $pay[6]
                ]);
            }
            echo "[SUCCESS] Seeded initial payments & billing." . PHP_EOL;
        }
    
        // Warranties
        $warrCount = $pdo->query('SELECT COUNT(*) FROM warranties')->fetchColumn();
        if ($warrCount == 0) {
            $warrStmt = $pdo->prepare('
                INSERT INTO warranties (warranty_code, user_id, title, customer_name, coverage, install_date, expiry_date, status)
                VALUES (:code, :uid, :title, :cust, :cov, :inst, :exp, :status)
            ');
            $initialWarranties = [
                ['W-2026-001', 'Viking Quick Response Concealed Sprinklers (Plant 1)', $customerComp, 'Full 5-year replacement warranty on glass bulb elements, deflectors, and pre-trimmed riser check valves against manufacturer defects.', '2025-10-01', '2030-10-01', 'Active'],
            ];
            foreach ($initialWarranties as $w) {
                $warrStmt->execute([
                    ':code'   => $w[0],
                    ':uid'    => $customerId,
                    ':title'  => $w[1],
                    ':cust'   => $w[2],
                    ':cov'    => $w[3],
                    ':inst'   => $w[4],
                    ':exp'    => $w[5],
                    ':status' => $w[6]
                ]);
            }
            echo "[SUCCESS] Seeded initial warranties." . PHP_EOL;
        }
    
        // Maintenance Schedules
        $maintCount = $pdo->query('SELECT COUNT(*) FROM maintenance_schedules')->fetchColumn();
        if ($maintCount == 0) {
            $maintStmt = $pdo->prepare('
                INSERT INTO maintenance_schedules (maintenance_code, user_id, title, customer_name, technician, scheduled_date, status, notes)
                VALUES (:code, :uid, :title, :cust, :tech, :sdate, :status, :notes)
            ');
            $initialMaintenance = [
                ['maint-1', 'Quarterly Deluge Valve Pressure Diagnostic', $customerComp, 'Engr. D. Santos', '2026-10-10', 'Overdue', 'Main deluge riser valve calibration overdue for manufacturing hall A.'],
            ];
            foreach ($initialMaintenance as $m) {
                $maintStmt->execute([
                    ':code'   => $m[0],
                    ':uid'    => $customerId,
                    ':title'  => $m[1],
                    ':cust'   => $m[2],
                    ':tech'   => $m[3],
                    ':sdate'  => $m[4],
                    ':status' => $m[5],
                    ':notes'  => $m[6]
                ]);
            }
            echo "[SUCCESS] Seeded initial maintenance schedules." . PHP_EOL;
        }
    }
} else {
    echo "[INFO] Sample customer seeding skipped; set both sample customer email and password in .env to enable it." . PHP_EOL;
}

echo "=== Provisioning Completed Successfully ===" . PHP_EOL;
