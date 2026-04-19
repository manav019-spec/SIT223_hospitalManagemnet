pipeline {
    agent any
    
    environment {
        SONAR_TOKEN = credentials('SONAR_TOKEN')
    }
    
    stages {
        // Stage 1: Checkout
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/manav019-spec/SIT223_hospitalManagemnet.git'
            }
        }
        
        //  Stage 2: Build
        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('Backend') {  
                            bat 'npm install'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('Frontend') { 
                            bat 'npm install'
                            bat 'set CI=false && npm run build'
                        }
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'Frontend/build/**/*', allowEmptyArchive: true
                }
            }
        }
        
        // Stage 3: Test
        stage('Test') {
            steps {
                dir('Backend') {
                    bat 'npm test -- --forceExit'
                }
            }
            post {
                always {
                    junit testResults: 'Backend/coverage/junit.xml', allowEmptyResults: true
                    script {
                        def status = currentBuild.result ?: 'SUCCESS'
                        emailext(
                            to: 'manavjain0078600786@gmail.com',
                            subject: "Jenkins - Test Stage: ${status} - Build #${env.BUILD_NUMBER}",
                            body: """
                                <html><body>
                                <h2>Test Stage Notification</h2>
                                <p><b>Project:</b> ${env.JOB_NAME}</p>
                                <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                                <p><b>Status:</b> ${status}</p>
                                <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                                </body></html>
                            """,
                            mimeType: 'text/html',
                            attachLog: true,
                            compressLog: true
                        )
                    }
                }
            }
        }
        
        // Stage 4: SonarCloud Analysis
        stage('SonarCloud Analysis') {
                steps {
                    echo '═══ SONARCLOUD CODE QUALITY ANALYSIS ═══'
                    dir('Frontend') {
                        bat '''
                        echo "Downloading SonarScanner..."
                        curl -o sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-windows.zip
        
                        echo "Extracting SonarScanner..."
                        powershell -Command "Expand-Archive -Path sonar-scanner.zip -DestinationPath . -Force"
        
                        echo "Running SonarCloud analysis..."
                        sonar-scanner-5.0.1.3006-windows\\bin\\sonar-scanner.bat ^
                          -Dsonar.projectKey=manav019-spec_SIT223_hospitalManagemnet2 ^
                          -Dsonar.organization=manav019-spec ^
                          -Dsonar.host.url=https://sonarcloud.io ^
                          -Dsonar.token=%SONAR_TOKEN% ^
                          -Dsonar.sources=src ^
                          -Dsonar.exclusions=**/node_modules/**,**/build/**
                    '''
                }
                echo 'SonarCloud analysis complete'
            }
        }
        
        // Stage 5: Security Scan
        stage('Security Scan') {
            steps {
                echo '═══ NPM AUDIT SECURITY SCAN ═══'
                dir('Backend') {
                    bat 'npm audit --json > backend-audit.json || exit 0'
                }
                dir('Frontend') {
                    bat 'npm audit --json > frontend-audit.json || exit 0'
                }
                echo 'Security scan completed - check audit JSON files for details'
            }
            post {
                always {
                    script {
                        def status = currentBuild.result ?: 'SUCCESS'
                        emailext(
                            to: 'manavjain0078600786@gmail.com',
                            subject: "Jenkins - Security Scan: ${status} - Build #${env.BUILD_NUMBER}",
                            body: """
                                <html><body>
                                <h2>Security Scan Notification</h2>
                                <p><b>Project:</b> ${env.JOB_NAME}</p>
                                <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                                <p><b>Status:</b> ${status}</p>
                                <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                                </body></html>
                            """,
                            mimeType: 'text/html',
                            attachLog: true,
                            compressLog: true
                        )
                    }
                }
            }
        }
        
        // Stage 6: Deploy to Docker
        stage('Deploy to Docker') {
            steps {
                echo '═══ DEPLOYING TO DOCKER CONTAINERS ═══'
                bat 'docker-compose down || echo "No containers running"'
                bat 'docker-compose up -d --build'
                bat 'timeout /t 15 /nobreak'
                echo 'Deployment complete'
            }
        }
        
        // Stage 7: Release
        stage('Release') {
            steps {
                echo '═══ CREATING RELEASE ═══'
                script {
                    def version = new Date().format('yyyyMMdd-HHmmss')
                    echo "Creating release: mahavir-mediscope-${version}"
                    bat "git tag release-${version} || echo Tag created"
                    bat "git push origin release-${version} || echo Push skipped"
                }
                echo 'Release created'
            }
        }
        
        // Stage 8: Monitoring & Alerting
        stage('Monitoring & Alerting') {
            steps {
                echo '═══ MONITORING DASHBOARDS ═══'
                bat 'docker-compose -f docker-compose.monitoring.yml up -d || echo "Monitoring already running"'
                script {
                    def health = bat(
                        script: 'curl -s http://localhost:5000/health',
                        returnStdout: true
                    ).trim()
                    echo "Health Check: ${health}"
                    echo 'Prometheus: http://localhost:9090'
                    echo 'Grafana: http://localhost:3000 (admin/admin)'
                }
                echo 'Monitoring configured'
            }
        }
    }
    
    post {
        success {
            echo 'ALL 8 STAGES PASSED!'
            emailext(
                subject: "SUCCESS: Mahavir Mediscope - Build #${env.BUILD_NUMBER}",
                body: """
                    <html><body>
                    <h2>Pipeline Completed Successfully!</h2>
                    <p><b>Project:</b> Mahavir Mediscope Eye Centre</p>
                    <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                    <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><b>SonarCloud:</b> <a href="https://sonarcloud.io/project/overview?id=manav019-spec_SIT223_hospitalManagemnet2">View Report</a></p>
                    </body></html>
                """,
                mimeType: 'text/html',
                to: 'manavjain0078600786@gmail.com',
                attachLog: true
            )
        }
        failure {
            emailext(
                subject: "FAILED: Mahavir Mediscope - Build #${env.BUILD_NUMBER}",
                body: """
                    <html><body>
                    <h2>Pipeline Failed</h2>
                    <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                    <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p>Check attached log for details.</p>
                    </body></html>
                """,
                mimeType: 'text/html',
                to: 'manavjain0078600786@gmail.com',
                attachLog: true
            )
            echo 'Pipeline failed'
        }
    }
}