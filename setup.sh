#!/bin/bash

# Web Conversion Optimizer - Setup Script
# このスクリプトはプロジェクトの初期セットアップを自動化します

echo "🚀 Web Conversion Optimizer セットアップを開始します..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_info "必要なツールをチェックしています..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js がインストールされていません"
        print_info "https://nodejs.org/ からインストールしてください"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm がインストールされていません"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git がインストールされていません"
        print_info "https://git-scm.com/ からインストールしてください"
        exit 1
    fi
    
    print_status "必要なツールが確認できました"
}

# Generate API keys
generate_api_key() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# Setup environment variables
setup_env() {
    print_info "環境変数ファイルを設定しています..."
    
    if [ ! -f .env.local ]; then
        cp .env.example .env.local
        print_status ".env.local ファイルを作成しました"
        
        # Generate API key for scraper service
        SCRAPER_API_KEY=$(generate_api_key)
        
        # Update the API key in .env.local
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-scraper-service-api-key-here/$SCRAPER_API_KEY/g" .env.local
        else
            # Linux
            sed -i "s/your-scraper-service-api-key-here/$SCRAPER_API_KEY/g" .env.local
        fi
        
        print_status "スクレイパーサービス用APIキーを生成しました: $SCRAPER_API_KEY"
        print_warning ".env.local ファイルを編集して、必要なAPIキーを設定してください"
    else
        print_warning ".env.local ファイルは既に存在します"
    fi
}

# Install dependencies
install_dependencies() {
    print_info "依存関係をインストールしています..."
    
    # Frontend dependencies
    cd frontend
    print_info "フロントエンドの依存関係をインストール中..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "フロントエンドの依存関係をインストールしました"
    else
        print_error "フロントエンドの依存関係のインストールに失敗しました"
        exit 1
    fi
    cd ..
    
    # Scraper service dependencies
    cd scraper-service
    print_info "スクレイパーサービスの依存関係をインストール中..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "スクレイパーサービスの依存関係をインストールしました"
    else
        print_error "スクレイパーサービスの依存関係のインストールに失敗しました"
        exit 1
    fi
    cd ..
}

# Verify installation
verify_installation() {
    print_info "インストールを検証しています..."
    
    # Test frontend build
    cd frontend
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "フロントエンドのビルドが成功しました"
    else
        print_warning "フロントエンドのビルドで警告が発生しました（環境変数を設定してください）"
    fi
    cd ..
    
    # Test scraper service
    cd scraper-service
    npm test > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "スクレイパーサービスのテストが成功しました"
    else
        print_warning "スクレイパーサービスのテストで警告が発生しました"
    fi
    cd ..
}

# Create development scripts
create_dev_scripts() {
    print_info "開発用スクリプトを作成しています..."
    
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 開発サーバーを起動しています..."

# Start scraper service in background
cd scraper-service
npm run dev &
SCRAPER_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ 開発サーバーが起動しました"
echo "   フロントエンド: http://localhost:3000"
echo "   スクレイパーサービス: http://localhost:3001"
echo "   停止するには Ctrl+C を押してください"

# Function to cleanup background processes
cleanup() {
    echo "🛑 サーバーを停止しています..."
    kill $SCRAPER_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for processes
wait
EOF
    
    chmod +x start-dev.sh
    print_status "開発用スクリプト (start-dev.sh) を作成しました"
}

# Main setup process
main() {
    echo "================================================"
    echo "🔧 Web Conversion Optimizer Setup"
    echo "================================================"
    
    check_requirements
    setup_env
    install_dependencies
    verify_installation
    create_dev_scripts
    
    echo ""
    echo "================================================"
    echo -e "${GREEN}🎉 セットアップが完了しました！${NC}"
    echo "================================================"
    echo ""
    print_info "次のステップ:"
    echo "  1. .env.local ファイルを編集して必要なAPIキーを設定"
    echo "  2. ./start-dev.sh を実行して開発サーバーを起動"
    echo "  3. http://localhost:3000 でアプリケーションにアクセス"
    echo ""
    print_info "デプロイについては DEPLOYMENT.md を参照してください"
    echo ""
    print_warning "重要: .env.local ファイルには機密情報が含まれるため、Gitにコミットしないでください"
}

# Run main function
main