pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend checks') {
            steps {
                dir('backend') {
                    sh 'uv sync --group dev'
                    sh 'uv run ruff check src tests'
                    sh 'uv run pytest --cov=series_app --cov-report=term-missing --junitxml=../reports/backend-junit.xml'
                }
            }
        }

        stage('Frontend build') {
            steps {
                dir('frontend') {
                    sh 'corepack yarn install --immutable'
                    sh 'corepack yarn build'
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'reports/backend-junit.xml', allowEmptyResults: true
            archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
        }
        cleanup {
            deleteDir()
        }
    }
}
