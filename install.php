<?php
// Installation script - run this once to set up the database
require_once 'config/database.php';

// Run database setup
if (setupDatabase()) {
    echo "<!DOCTYPE html>
    <html>
    <head>
        <title>Pharma4 Installation</title>
        <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>
    </head>
    <body>
        <div class='container mt-5'>
            <div class='card'>
                <div class='card-header bg-success text-white'>
                    <h3>Installation Successful! ✅</h3>
                </div>
                <div class='card-body'>
                    <h5>Database and tables created successfully</h5>
                    <p>Default login credentials:</p>
                    <ul>
                        <li><strong>Username:</strong> admin</li>
                        <li><strong>Password:</strong> admin123</li>
                    </ul>
                    <p class='text-warning'><strong>Important:</strong> Change the default password after first login!</p>
                    <a href='auth/login.php' class='btn btn-primary'>Go to Login Page</a>
                </div>
            </div>
        </div>
    </body>
    </html>";
}
?>