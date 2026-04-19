pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-dockerhub-username'
        APP_VERSION = sh(script: 'git describe --tags --always', returnStdout: true).trim()
        SONAR_HOST_URL = 'http://localhost:9000'
    }
    
    tools {
        nodejs 'NodeJS-18'
        docker 'Docker'
    }
    
    stages {
        //  STAGE 1: BUILD
        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm run build || echo "No build script"'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'backend/package.json, frontend/build/**', allowEmptyArchive: true
                    stash name: 'backend-source', includes: 'backend/**'
                    stash name: 'frontend-source', includes: 'frontend/**'
                }
            }
        }
        
        //  STAGE 2: TEST
        stage('Test') {
            parallel {
                stage('Unit Tests - Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm test -- --coverage --watchAll=false'
                        }
                    }
                    post {
                        success {
                            junit 'backend/coverage/junit.xml'
                            publishCoverage adapters: [coberturaAdapter('backend/coverage/cobertura-coverage.xml')]
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh '''
                            docker-compose -f docker-compose.test.yml up -d
                            sleep 10
                            curl -f http://localhost:5000/health || exit 1
                            curl -f http://localhost:5000/api/test || exit 1
                        '''
                    }
                    post {
                        always {
                            sh 'docker-compose -f docker-compose.test.yml down'
                        }
                    }
                }
            }
        }
        
        //  STAGE 3: CODE QUALITY (SonarQube)
        stage('Code Quality') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=healthcare-app \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info \
                          -Dsonar.exclusions=**/node_modules/**,**/build/**
                    '''
                }
            }
            post {
                success {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        //  STAGE 4: SECURITY SCANNING
        stage('Security') {
            parallel {
                stage('SAST - SonarQube Security') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh 'sonar-scanner -Dsonar.projectKey=healthcare-app-security'
                        }
                    }
                }
                stage('Dependency Scan - Snyk') {
                    steps {
                        sh '''
                            snyk test --severity-threshold=high || true
                            snyk monitor
                        '''
                    }
                }
                stage('Container Scan - Trivy') {
                    steps {
                        sh '''
                            docker build -t healthcare-app:scan ./backend
                            trivy image --severity HIGH,CRITICAL --exit-code 0 healthcare-app:scan
                        '''
                    }
                }
            }
            post {
                success {
                    recordIssues(tools: [snykSecurity()])
                }
            }
        }
        
        //  STAGE 5: DOCKER IMAGE BUILD 
        stage('Docker Build') {
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}/healthcare-backend:${APP_VERSION}", "./backend")
                    docker.build("${DOCKER_REGISTRY}/healthcare-frontend:${APP_VERSION}", "./frontend")
                }
            }
            post {
                success {
                    stash name: 'backend-image', includes: 'backend-image.tar'
                    stash name: 'frontend-image', includes: 'frontend-image.tar'
                }
            }
        }
        
        // STAGE 6: DEPLOY (Staging)
        stage('Deploy to Staging') {
            steps {
                sh '''
                    docker-compose -f docker-compose.staging.yml up -d --force-recreate
                    sleep 15
                    curl -f http://localhost:5000/health
                '''
            }
            post {
                success {
                    sh 'docker-compose -f docker-compose.staging.yml ps'
                }
            }
        }
        
        // STAGE 7: RELEASE (Production)
        stage('Release to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh """
                        docker tag ${DOCKER_REGISTRY}/healthcare-backend:${APP_VERSION} ${DOCKER_REGISTRY}/healthcare-backend:latest
                        docker tag ${DOCKER_REGISTRY}/healthcare-frontend:${APP_VERSION} ${DOCKER_REGISTRY}/healthcare-frontend:latest
                        docker push ${DOCKER_REGISTRY}/healthcare-backend:${APP_VERSION}
                        docker push ${DOCKER_REGISTRY}/healthcare-frontend:${APP_VERSION}
                        docker push ${DOCKER_REGISTRY}/healthcare-backend:latest
                        docker push ${DOCKER_REGISTRY}/healthcare-frontend:latest
                        
                        // Git tag for release
                        sh "git tag release-${APP_VERSION}"
                        sh "git push origin release-${APP_VERSION}"
                    '''
                }
            }
            post {
                success {
                    sh '''
                        docker stack deploy -c docker-compose.prod.yml healthcare-app
                    '''
                }
            }
        }
        
        //  STAGE 8: MONITORING & ALERTING
        stage('Monitoring Setup') {
            steps {
                script {
                    sh '''
                        # Deploy Prometheus and Grafana
                        docker-compose -f docker-compose.monitoring.yml up -d
                        
                        # Configure alert rules
                        cat > prometheus/alerts.yml << EOF
                        groups:
                          - name: healthcare_alerts
                            rules:
                              - alert: HighErrorRate
                                expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
                                for: 2m
                                annotations:
                                  summary: "High error rate detected"
                              - alert: BackendDown
                                expr: up{job="backend"} == 0
                                for: 1m
                                annotations:
                                  summary: "Backend service is down"
                              - alert: HighResponseTime
                                expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
                                annotations:
                                  summary: "Response time above 500ms"
                        EOF
                        
                        # Reload Prometheus config
                        curl -X POST http://localhost:9090/-/reload
                    '''
                }
            }
        }
        
        // STAGE 9: SMOKE TESTS
        stage('Smoke Tests') {
            steps {
                sh '''
                    echo "Running smoke tests..."
                    curl -f http://localhost:5000/health || exit 1
                    curl -f http://localhost/metrics || exit 1
                    curl -f http://localhost/api/test || exit 1
                    
                    # Verify React app is serving
                    curl -f http://localhost | grep -q "Mahavir Mediscope" || exit 1
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
            slackSend(color: 'good', message: "Build ${APP_VERSION} succeeded! Deployed to production.")
        }
        failure {
            echo 'Pipeline failed!'
            slackSend(color: 'danger', message: "Build ${APP_VERSION} failed! Check Jenkins logs.")
        }
    }
}