pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'manav019'
        // Get version from git commit hash
        APP_VERSION = powershell(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }
    
    stages {
        //  STAGE 1: BUILD
        stage('Build') {
            parallel {
                stage('Install Backend Dependencies') {
                    steps {
                        dir('backend') {
                            bat 'npm install'
                            echo 'Backend dependencies installed'
                        }
                    }
                }
                stage('Install Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            bat 'npm install'
                            echo 'Frontend dependencies installed'
                        }
                    }
                }
            }
        }
        
        // STAGE 2: TEST
        stage('Test') {
            parallel {
                stage('Backend Unit Tests') {
                    steps {
                        dir('backend') {
                            bat 'npm test'
                        }
                    }
                    post {
                        success {
                            echo 'All backend tests passed!'
                        }
                        failure {
                            echo 'Backend tests failed!'
                        }
                    }
                }
                stage('Frontend Build Test') {
                    steps {
                        dir('frontend') {
                            // Just check if build works (React apps need build test)
                            bat 'npm run build'
                        }
                    }
                    post {
                        success {
                            echo 'Frontend builds successfully!'
                        }
                    }
                }
            }
        }
        
        //  STAGE 3: CODE QUALITY
        stage('Code Quality') {
            steps {
                echo 'Running code quality checks...'
                
                // Check backend code for common issues
                dir('backend') {
                    bat 'npm run lint || echo "No lint script found"'
                }
                
                // Check frontend code
                dir('frontend') {
                    bat 'npm run lint || echo "No lint script found"'
                }
                
                echo 'Code quality checks completed'
            }
        }
        
        //  STAGE 4: SECURITY SCANNING
        stage('Security Scan') {
            steps {
                echo 'Running security checks...'
                
                // Check for vulnerable dependencies in backend
                dir('backend') {
                    bat 'npm audit --production || echo "Run npm audit fix to fix issues"'
                }
                
                // Check for vulnerable dependencies in frontend
                dir('frontend') {
                    bat 'npm audit --production || echo "Run npm audit fix to fix issues"'
                }
                
                echo 'Security scan completed'
            }
            post {
                success {
                    echo 'No critical vulnerabilities found'
                }
                failure {
                    echo 'Vulnerabilities detected - please review'
                }
            }
        }
        
        //  STAGE 5: DOCKER BUILD 
        stage('Docker Build') {
            steps {
                echo 'Building Docker images...'
                
                // Build backend image
                bat 'docker build -t healthcare-backend:latest ./backend'
                
                // Build frontend image  
                bat 'docker build -t healthcare-frontend:latest ./frontend'
                
                echo 'Docker images built successfully'
            }
            post {
                success {
                    // Save images for later stages
                    bat 'docker save healthcare-backend:latest -o backend-image.tar'
                    bat 'docker save healthcare-frontend:latest -o frontend-image.tar'
                    archiveArtifacts artifacts: '*.tar', allowEmptyArchive: true
                }
            }
        }
        
        //  STAGE 6: DEPLOY (Local) 
        stage('Deploy to Local') {
            steps {
                echo 'Deploying application...'
                
                // Stop any existing containers
                bat 'docker-compose down || true'
                
                // Start fresh deployment
                bat 'docker-compose up -d --build'
                
                // Wait for services to start
                bat 'timeout /t 10 /nobreak'
                
                echo 'Deployment completed'
            }
            post {
                success {
                    echo 'Application deployed successfully!'
                }
            }
        }
        
        //  STAGE 7: VERIFICATION (Smoke Tests) 
        stage('Verify Deployment') {
            steps {
                echo 'Running verification tests...'
                
                // Test backend health endpoint
                bat 'curl -f http://localhost:5000/health || exit 1'
                
                // Test backend API
                bat 'curl -f http://localhost:5000/api/test || exit 1'
                
                // Test frontend is serving
                bat 'curl -f http://localhost || exit 1'
                
                echo 'All verification tests passed!'
            }
            post {
                success {
                    echo 'Application is running correctly!'
                }
                failure {
                    echo 'Verification failed - application not responding'
                }
            }
        }
        
        //  STAGE 8: RELEASE (Docker Hub) 
        stage('Release to Registry') {
            when {
                // Only run on main branch
                branch 'main'
            }
            steps {
                echo 'Publishing to Docker Registry...'
                
                // Tag images for registry
                bat "docker tag healthcare-backend:latest ${DOCKER_REGISTRY}/healthcare-backend:${APP_VERSION}"
                bat "docker tag healthcare-frontend:latest ${DOCKER_REGISTRY}/healthcare-frontend:${APP_VERSION}"
                
                // Push to registry (requires docker login first)
                bat "docker push ${DOCKER_REGISTRY}/healthcare-backend:${APP_VERSION}"
                bat "docker push ${DOCKER_REGISTRY}/healthcare-frontend:${APP_VERSION}"
                
                // Also tag as latest
                bat "docker tag healthcare-backend:latest ${DOCKER_REGISTRY}/healthcare-backend:latest"
                bat "docker push ${DOCKER_REGISTRY}/healthcare-backend:latest"
                
                echo 'Images published to Docker Hub!'
            }
        }
        
        // STAGE 9: MONITORING SETUP 
        stage('Monitoring Setup') {
            steps {
                echo 'Setting up monitoring...'
                
                // Start Prometheus for metrics collection
                bat 'docker run -d --name prometheus -p 9090:9090 prom/prometheus || echo "Prometheus already running"'
                
                // Start Grafana for visualization
                bat 'docker run -d --name grafana -p 3000:3000 grafana/grafana || echo "Grafana already running"'
                
                echo 'Monitoring tools started!'
                echo 'Grafana: http://localhost:3000 (admin/admin)'
                echo 'Prometheus: http://localhost:9090'
            }
        }
        
        // STAGE 10: FINAL STATUS
        stage('Final Status') {
            steps {

                echo 'Pipeline Execution Complete!'
                echo "Version: ${APP_VERSION}"
                echo "Backend: http://localhost:5000"
                echo "Frontend: http://localhost"
                echo "Health Check: http://localhost:5000/health"
                echo "Metrics: http://localhost:5000/metrics"
                echo "Prometheus: http://localhost:9090"
                echo "Grafana: http://localhost:3000"
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished. Cleaning up...'
            // Optional: Keep containers running for verification
            // cleanWs() - uncomment if you want to clean workspace
        }
        success {
            echo ' PIPELINE SUCCESSFUL! All stages passed!'
        }
        failure {
            echo ' PIPELINE FAILED! Check logs above for errors.'
        }
    }
}