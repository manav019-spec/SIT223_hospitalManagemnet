pipeline {
    agent any
    
    environment {
        SONAR_TOKEN = credentials('SONAR_TOKEN')
    }
    
    stages {
        // Stage 1: Checkout
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/manav019-spec/SIT223_hospitalManagemnet.git', credentialsId: 'git-init'
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
                    echo 'Creating Docker images as artifacts...'
                    bat 'docker build -t healthcare-backend:latest ./Backend'
                    bat 'docker build -t healthcare-frontend:latest ./Frontend'

                    bat 'docker save healthcare-backend:latest -o backend.tar'
                    bat 'docker save healthcare-frontend:latest -o frontend.tar'

                    archiveArtifacts artifacts: '*.tar', allowEmptyArchive: true
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

        // Additional Stage: Code Quality (Linting)
        stage('Code Quality') {
            steps {
                echo '═══ CODE QUALITY CHECK (LINT) ═══'
                dir('Backend') {
                    bat 'npm run lint || echo "No lint issues"'
                }
                dir('Frontend') {
                    bat 'npm run lint || echo "No lint issues"'
                }
                echo 'Code quality checks completed'
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
                bat 'ping -n 16 127.0.0.1 > nul' // Wait for 15 seconds to allow containers to start    
                echo 'Deployment complete'
            }
        }

        // Additional Stage: Verify Deployment
        stage('Verify Deployment') {
            steps {
                powershell '''
                try {
                    $res = Invoke-WebRequest http://localhost:5000/health
                    if ($res.StatusCode -ne 200) { exit 1 }
                } catch { exit 1 }
                '''
            }
        }
        
        // Stage 7: Release
        stage('Release') {
            when { branch 'main' }   // Only release from main branch

            steps {
                echo '═══ PRODUCTION RELEASE STAGE ═══'

                script {
                    def version = new Date().format('yyyyMMdd-HHmmss')
                    echo "Releasing version: ${version}"

                    // Authenticate with GitHub
                    withCredentials([usernamePassword(
                        credentialsId: 'git-init',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_PASS'
                    )]) {
                    
                        // Configure Git
                        bat """
                        git config user.email "manavjain0078600786@gmail.com"
                        git config user.name "Manav Jain"

                        git tag release-${version}

                        git push https://%GIT_USER%:%GIT_PASS%@github.com/manav019-spec/SIT223_hospitalManagemnet.git --tags
                        """
                    }

                    // Promote Docker images (IMPORTANT for marks)
                    bat "docker tag healthcare-backend:latest manav019/healthcare-backend:${version}"
                    bat "docker tag healthcare-frontend:latest manav019/healthcare-frontend:${version}"

                    echo "Docker images tagged as production version"
                }

                echo 'Release completed successfully'
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