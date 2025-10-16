# Deployment Guide

This guide covers different deployment options for the Pump Health Monitoring System.

## Table of Contents

1. [Local Deployment](#local-deployment)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Production Considerations](#production-considerations)

## Local Deployment

### Prerequisites
- Python 3.8+
- 4GB RAM minimum
- 2GB disk space

### Steps

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Train the model:**
   ```bash
   cd src
   python train_model.py
   ```

3. **Start the dashboard:**
   ```bash
   streamlit run dashboard.py
   ```

4. **Access the application:**
   - Open browser to `http://localhost:8501`

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+

### Using Docker Compose (Recommended)

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f pump-monitor
   ```

3. **Access the application:**
   - Open browser to `http://localhost:8501`

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t pump-health-monitor .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     -p 8501:8501 \
     -v $(pwd)/data:/app/data \
     -v $(pwd)/src/models:/app/src/models \
     --name pump-monitor \
     pump-health-monitor
   ```

3. **View logs:**
   ```bash
   docker logs -f pump-monitor
   ```

4. **Stop the container:**
   ```bash
   docker stop pump-monitor
   docker rm pump-monitor
   ```

### Pre-training the Model

To include a pre-trained model in the Docker image:

1. **Train locally:**
   ```bash
   cd src
   python train_model.py
   ```

2. **Uncomment the training line in Dockerfile:**
   ```dockerfile
   RUN cd src && python train_model.py
   ```

3. **Rebuild the image:**
   ```bash
   docker build -t pump-health-monitor .
   ```

## Cloud Deployment

### AWS Deployment (EC2)

1. **Launch EC2 instance:**
   - Instance type: t3.medium or larger
   - OS: Ubuntu 22.04 LTS
   - Storage: 20GB
   - Security group: Allow inbound TCP 8501

2. **Connect and install Docker:**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   
   # Install Docker
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   ```

3. **Deploy application:**
   ```bash
   git clone https://github.com/Petrokens/AI-based-pump-health-monitoring-tool.git
   cd AI-based-pump-health-monitoring-tool
   docker-compose up -d
   ```

4. **Configure SSL (optional):**
   - Use Nginx as reverse proxy
   - Install Let's Encrypt certificate
   - Configure HTTPS redirect

### Azure Deployment (Container Instances)

1. **Create Azure Container Registry:**
   ```bash
   az acr create --resource-group myResourceGroup \
     --name pumpmonitor --sku Basic
   ```

2. **Build and push image:**
   ```bash
   docker build -t pump-health-monitor .
   az acr login --name pumpmonitor
   docker tag pump-health-monitor pumpmonitor.azurecr.io/pump-health-monitor
   docker push pumpmonitor.azurecr.io/pump-health-monitor
   ```

3. **Deploy container:**
   ```bash
   az container create \
     --resource-group myResourceGroup \
     --name pump-monitor \
     --image pumpmonitor.azurecr.io/pump-health-monitor \
     --dns-name-label pump-monitor \
     --ports 8501
   ```

### Google Cloud Platform (Cloud Run)

1. **Build and submit image:**
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/pump-health-monitor
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy pump-health-monitor \
     --image gcr.io/[PROJECT-ID]/pump-health-monitor \
     --platform managed \
     --port 8501 \
     --allow-unauthenticated
   ```

### Streamlit Cloud (Free Tier)

1. **Fork the repository** on GitHub

2. **Go to** [share.streamlit.io](https://share.streamlit.io)

3. **Deploy:**
   - Connect your GitHub account
   - Select the repository
   - Set main file path: `src/dashboard.py`
   - Deploy!

## Production Considerations

### Performance Optimization

1. **Caching:**
   - Enable Streamlit caching for data loading
   - Use Redis for distributed caching
   - Cache model predictions

2. **Database:**
   - Replace CSV with PostgreSQL/TimescaleDB
   - Implement proper indexing
   - Use connection pooling

3. **Model Serving:**
   - Consider TensorFlow Serving or TorchServe
   - Implement model versioning
   - Add A/B testing capabilities

### Security

1. **Authentication:**
   ```python
   # Add to dashboard.py
   import streamlit_authenticator as stauth
   
   authenticator = stauth.Authenticate(
       names, usernames, passwords,
       'pump_monitor', 'key123', cookie_expiry_days=30
   )
   name, authentication_status, username = authenticator.login('Login', 'main')
   ```

2. **Environment Variables:**
   ```bash
   # Use .env file
   DB_HOST=localhost
   DB_PASSWORD=secret
   API_KEY=your-key
   ```

3. **HTTPS:**
   - Use Let's Encrypt for SSL certificates
   - Enable HTTPS redirect
   - Set secure headers

### Monitoring

1. **Application Monitoring:**
   - Use Prometheus + Grafana
   - Monitor prediction latency
   - Track model performance drift

2. **Infrastructure Monitoring:**
   - CPU/Memory usage
   - Disk I/O
   - Network traffic

3. **Logging:**
   ```python
   import logging
   
   logging.basicConfig(
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
       handlers=[
           logging.FileHandler('app.log'),
           logging.StreamHandler()
       ]
   )
   ```

### Scaling

1. **Horizontal Scaling:**
   - Deploy multiple instances behind load balancer
   - Use session affinity for stateful features
   - Implement distributed caching

2. **Vertical Scaling:**
   - Increase container resources
   - Optimize model inference
   - Use GPU for large models

3. **Database Scaling:**
   - Implement read replicas
   - Use connection pooling
   - Partition large tables

### Backup and Recovery

1. **Model Backup:**
   ```bash
   # Automated backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   tar -czf model_backup_$DATE.tar.gz src/models/
   aws s3 cp model_backup_$DATE.tar.gz s3://backups/
   ```

2. **Data Backup:**
   - Regular database backups
   - Point-in-time recovery
   - Off-site backup storage

3. **Disaster Recovery:**
   - Document recovery procedures
   - Test recovery process regularly
   - Maintain multiple backup locations

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t pump-health-monitor .
      
      - name: Run tests
        run: docker run pump-health-monitor python tests/test_data_loader.py
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
          docker tag pump-health-monitor myrepo/pump-health-monitor:latest
          docker push myrepo/pump-health-monitor:latest
      
      - name: Deploy to server
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} \
            "docker pull myrepo/pump-health-monitor:latest && \
             docker-compose up -d"
```

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Check application logs
   - Review prediction accuracy
   - Monitor resource usage

2. **Monthly:**
   - Retrain model with new data
   - Update dependencies
   - Review security patches

3. **Quarterly:**
   - Audit access logs
   - Review and update documentation
   - Performance optimization review

### Troubleshooting

Common issues and solutions:

1. **High memory usage:**
   - Reduce batch size
   - Implement data pagination
   - Clear cache periodically

2. **Slow predictions:**
   - Optimize feature engineering
   - Use model quantization
   - Implement prediction caching

3. **Connection errors:**
   - Check database connectivity
   - Verify network configuration
   - Review firewall rules

## Support

For deployment issues:
- Check application logs
- Review GitHub Issues
- Contact support team

---

**Last Updated:** 2024-10-16
