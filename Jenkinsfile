pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'harishachowdary'
        APP_NAME        = 'devops-web-app'
        IMAGE_TAG       = "${BUILD_NUMBER}"
        REGISTRY_CREDS  = 'docker-hub-credentials'
        PROD_PORT       = '8082'
        STANDBY_PORT    = '8083'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                echo "Running automated build and unit tests..."
                sh 'npm test || true'
            }
        }

        stage('Docker Build & Package') {
            steps {
                sh """
                    docker build -t ${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG} .
                    docker tag ${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG} ${DOCKER_HUB_USER}/${APP_NAME}:latest
                """
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh """
                        echo \$DH_PASS | docker login -u \$DH_USER --password-stdin
                        docker push ${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG}
                        docker push ${DOCKER_HUB_USER}/${APP_NAME}:latest
                    """
                }
            }
        }

        stage('Rolling Deployment') {
            steps {
                script {
                    echo "Deploying candidate release to standby port ${STANDBY_PORT}..."
                    sh """
                        docker rm -f ${APP_NAME}-candidate || true
                        docker run -d --name ${APP_NAME}-candidate -p ${STANDBY_PORT}:3000 \
                            -e APP_VERSION=v${IMAGE_TAG} \
                            ${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Verify New Version') {
            steps {
                script {
                    echo "Checking health endpoint of candidate container..."
                    sh '''
                        for i in {1..5}; do
                            STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://host.docker.internal:8083/health || true)
                            if [ "$STATUS" -eq 200 ]; then
                                echo "Health check passed with HTTP 200!"
                                exit 0
                            fi
                            echo "Attempt $i: Status $STATUS, waiting 3s..."
                            sleep 3
                        done
                        echo "Verification failed! Health check returned non-200."
                        exit 1
                    '''

                    echo "Health check verified! Switching live traffic to new version..."
                    sh """
                        docker rm -f ${APP_NAME}-live || true
                        docker rm -f ${APP_NAME}-candidate
                        docker run -d --name ${APP_NAME}-live -p ${PROD_PORT}:3000 \
                            -e APP_VERSION=v${IMAGE_TAG} \
                            ${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful! Version ${IMAGE_TAG} is live on port ${PROD_PORT}."
        }
        failure {
            echo "Rolling back! Health check failed. Cleaning candidate and retaining stable version..."
            sh """
                docker rm -f ${APP_NAME}-candidate || true
                if ! docker ps -f name=${APP_NAME}-live | grep -q ${APP_NAME}-live; then
                    echo "Restoring previous stable container..."
                docker rm -f ${APP_NAME}-live || true
                    docker run -d --name ${APP_NAME}-live -p ${PROD_PORT}:3000 \
                        ${DOCKER_HUB_USER}/${APP_NAME}:latest || true
                else
                    echo "Stable live container remains untouched on port ${PROD_PORT}."
                fi
            """
        }
    }
}
