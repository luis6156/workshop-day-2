#!/bin/bash

# ArgoCD Installation Script
set -e

echo "🚀 Installing ArgoCD..."

# Create namespace
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
echo ""
echo "📝 ArgoCD is installed!"
echo ""
echo "🔑 Getting initial admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo ""
echo "================================================"
echo "✅ ArgoCD Installation Complete!"
echo "================================================"
echo ""
echo "Access ArgoCD:"
echo ""
echo "Option 1 - Port Forward (Local):"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  URL: https://localhost:8080"
echo ""
echo "Option 2 - Load Balancer (Cloud):"
echo "  kubectl patch svc argocd-server -n argocd -p '{\"spec\": {\"type\": \"LoadBalancer\"}}'"
echo "  kubectl get svc argocd-server -n argocd"
echo ""
echo "Credentials:"
echo "  Username: admin"
echo "  Password: ${ARGOCD_PASSWORD}"
echo ""
echo "Install ArgoCD CLI (optional):"
echo "  brew install argocd  # macOS"
echo "  curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64  # Linux"
echo ""
echo "Next steps:"
echo "  1. Access ArgoCD UI"
echo "  2. Connect your Git repository"
echo "  3. Create applications: kubectl apply -f argocd/applications/"
echo ""
