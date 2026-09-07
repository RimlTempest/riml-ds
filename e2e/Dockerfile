# VRT のベースラインは**この中でだけ**撮る（ADR-0007 §影響）。
# ホスト（macOS）で撮った画像はフォントとサブピクセル描画が違うのでコミットしない。
# Playwright のタグは @playwright/test と**同じ版**に固定する（上げるときは同じ PR で両方）。
FROM mcr.microsoft.com/playwright:v1.63.0-noble

# 日本語のグリフ。無いと豆腐になり、ベースラインが読めない
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-noto-cjk unzip \
  && rm -rf /var/lib/apt/lists/*

# Bun の版は mise.toml と同じに固定する
ENV BUN_INSTALL=/usr/local/bun
ENV PATH=/usr/local/bun/bin:$PATH
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.0"

WORKDIR /work
