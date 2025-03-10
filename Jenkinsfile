node {

    checkout scm

    env.DOCKER_API_VERSION="1.24"
    
    sh "git rev-parse --short HEAD > commit-id"

    tag = readFile('commit-id').replace("\n", "").replace("\r", "")
    appName = "hello-kenzan"
    registryHost = "192.168.49.2:30400/"
    imageName = "${registryHost}${appName}:${tag}"
    env.BUILDIMG=imageName

    println "Commit ID: ${tag}"
    println "Docker Image: ${imageName}"

    stage("Build") {
        println "Building Docker image..."
        sh "docker build -t ${imageName} -f applications/hello-kenzan/Dockerfile applications/hello-kenzan"
        println "Push complete."
    }

    stage("Push") {
        sh "docker push ${imageName}"
    }


    stage("Deploy") {
        sh "echo Deploying application..."
        
        //sh "export KUBECONFIG=/home/toan-pham/.kube/config"
        sh "kubectl config view"
        sh "kubectl get nodes"
        sh "kubectl apply -f applications/${appName}/k8s/"
    
    }
}