FROM jenkins/jenkins:lts

USER root

# Pre-Install Jenkins Plugins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Installing Docker CLI
# Installing Docker CLI (latest version)
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add - && \
    echo "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list && \
    apt-get update && apt-get install -y docker-ce-cli

# Install latest Docker CLI manually (to match host version)
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-24.0.6.tgz | tar xz && \
    mv docker/docker /usr/local/bin/ && \
    rm -rf docker

# Install kubectl manually from Google Cloud Storage
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm -f kubectl

# Grant jenkins user group access to /var/run/docker.sock
RUN groupadd -g 999 docker && usermod -aG docker jenkins
RUN chmod 666 /var/run/docker.sock || true

USER jenkins