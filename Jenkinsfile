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
                    sh 'uv run pytest --cov=series_app --cov-report=term-missing --cov-report=xml:coverage-backend.xml --junitxml=../reports/backend-junit.xml'
                }
            }
        }

        stage('Frontend checks') {
            steps {
                dir('frontend') {
                    sh 'corepack yarn install --immutable'
                    sh 'corepack yarn test:coverage'
                }
            }
        }

        stage('Frontend build') {
            steps {
                dir('frontend') {
                    sh 'corepack yarn build'
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'reports/backend-junit.xml', allowEmptyResults: true
            recordCoverage(
                tools: [[parser: 'COBERTURA', pattern: 'backend/coverage-backend.xml']],
                id: 'backend',
                name: 'Backend coverage',
                sourceDirectories: [[path: 'backend/src']]
            )
            recordCoverage(
                tools: [[parser: 'COBERTURA', pattern: 'frontend/coverage/cobertura-coverage.xml']],
                id: 'frontend',
                name: 'Frontend coverage',
                sourceDirectories: [[path: 'frontend/src']]
            )
            archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
        }
        cleanup {
            deleteDir()
        }
    }
}
