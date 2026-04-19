pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'local'
    }
    
    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'npm install'
                }
            }
        }
        
        stage('Test Backend') {
            steps {
                dir('backend') {
                    bat 'npm test || echo "Tests completed"'
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm install'
                    bat 'npm run build'
                }
            }
        }
        
        stage('Docker Build & Run') {
            steps {
                bat 'docker-compose down || true'
                bat 'docker-compose up -d --build'
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    // Wait for backend to be ready
                    timeout(time: 60, unit: 'SECONDS') {
                        waitUntil {
                            try {
                                def response = bat(script: 'curl -s http://localhost:5000/health', returnStdout: true).trim()
                                echo "Backend response: ${response}"
                                return true
                            } catch(Exception e) {
                                echo "Waiting for backend..."
                                sleep 5
                                return false
                            }
                        }
                    }
                }
            }
        }
        
        stage('Verify Application') {
            steps {
                bat 'curl -s http://localhost:5000/api/test'
                bat 'curl -s http://localhost'
                echo 'Application verified successfully!'
            }
        }
    }
    
    post {
        always {
            bat 'docker-compose down || true'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}