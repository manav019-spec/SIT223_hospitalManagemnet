pipeline {
    agent any
    
    environment {
       
        DOCKER_HOST = 'tcp://localhost:2375'
    }
    
    stages {
        stage('Clean') {
            steps {
                cleanWs()
                bat 'docker-compose down || echo "No containers running"'
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            bat 'npm install'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            bat 'npm install'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            bat 'npm test -- --forceExit'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            bat 'set CI=false && npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                bat 'docker-compose build'
            }
        }
        
        stage('Deploy') {
            steps {
                bat 'docker-compose up -d'
                bat 'timeout /t 10'
            }
        }
        
        stage('Verify') {
            steps {
                script {
                    def health = bat(script: 'curl -s http://localhost:5000/health', returnStdout: true).trim()
                    echo "Health Check: ${health}"
                }
            }
        }
    }
    
    post {
        always {
            bat 'docker-compose logs --tail=50 || true'
        }
        success {
            echo 'PIPELINE SUCCESS!'
        }
    }
}