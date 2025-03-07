node {

    checkout scm

    env.DOCKER_API_VERSION="1.24"
    
    sh "git rev-parse --short HEAD > commit-id"

    tag = readFile('commit-id').replace("\n", "").replace("\r", "")
    appName = "hello-kenzan"
    registryHost = "127.0.0.1:30400/"
    imageName = "${registryHost}${appName}:${tag}"
    env.BUILDIMG=imageName

    println "Commit ID: ${tag}"
    println "Docker Image: ${imageName}"

    stage("Build") {
        println "Building Docker image..."
        sh "docker build -t ${imageName} -f applications/hello-kenzan/Dockerfile applications/hello-kenzan"
        println "Push complete."
    }

    /*
    stage("Push") {
        sh "docker push ${imageName}"
    }


    stage("Deploy") {
        sh "echo Deploying application..."
        kubernetesDeploy configs: "applications/${appName}/k8s/*.yaml", kubeconfigId: 'kenzan_kubeconfig'
    }
    */
    stage("Push") {
        sh "docker push ${imageName}"
        sh "docker tag ${imageName} ${registryHost}${appName}:latest"  
        sh "docker push ${registryHost}${appName}:latest" 
    }

    stage("Deploy") {
        sh "kubectl apply -f applications/${appName}/k8s/"
    }
    
}