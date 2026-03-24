{ pkgs, ... }: {
  # NixOSチャンネルを指定
  channel = "stable-24.05";

  # 環境にインストールするパッケージ
  packages = [
    pkgs.python3 # プレビュー用のシンプルなWebサーバーを起動するためにPythonを使用
  ];

  # 環境変数を設定
  env = { };

  # VS Code拡張機能を指定
  idx.extensions = [
    # "vscodevim.vim" # 必要に応じてVim拡張機能のコメントを解除
  ];

  # ワークスペースのライフサイクル設定
  idx.workspace = {
    # ワークスペース作成時に実行するコマンド
    onCreate = {
      # welcome = "echo 'Welcome to your new workspace!'";
    };
    # ワークスペース開始時に実行するコマンド
    onStart = {
      # start-server = "npm run dev"; # Node.jsプロジェクトの場合
    };
  };

  # Webプレビューの設定
  idx.previews = {
    enable = true;
    previews = {
      # 'web'という名前のプレビューを定義
      web = {
        # プレビューを起動するコマンド
        # Pythonのhttp.serverモジュールを使い、動的に割り当てられたポートでサーバーを起動
        command = ["python" "-m" "http.server" "$PORT"];
        # 'web'マネージャーを使用
        manager = "web";
      };
    };
  };
}
