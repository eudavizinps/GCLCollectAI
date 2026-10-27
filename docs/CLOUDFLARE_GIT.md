# Deploy automático pelo GitHub

O Worker `collectai-demo` já foi publicado na conta Cloudflare `15705ccefdfbf96076615920c8f680ac`. Para que os próximos pushes para `main` publiquem automaticamente, conecte o repositório `eudavizinps/GCLCollectAI` ao Worker existente no painel Cloudflare:

1. Abra **Workers & Pages → collectai-demo → Settings → Builds → Connect**.
2. Escolha **GitHub**, o repositório **eudavizinps/GCLCollectAI** e a branch **main**.
3. Use a raiz `/` como diretório do projeto.
4. Comando de build: `npm ci --prefix frontend && npm run build --prefix frontend && python scripts/stage_cloudflare.py`
5. Comando de deploy: `cd .cloudflare-build && uv run pywrangler deploy`
6. Salve a ligação e confira o primeiro build no histórico do Worker.

O script de build copia somente a API, a configuração do Worker e o `dist` do frontend para uma pasta ignorada pelo Git. O build remoto usa o `uv` e o Python fornecidos pela imagem oficial de Workers Builds. O nome em `cloudflare/wrangler.jsonc` é `collectai-demo`, igual ao Worker existente.

A ligação exige a permissão **Workers Builds Configuration**. O token OAuth do Wrangler usado para publicar não possui essa permissão; por isso essa configuração final precisa ser feita no painel da conta. Até ela ser salva e um build passar, os commits no GitHub não acionam deploy automático deste Worker.
