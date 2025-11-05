### Extrato Financeiro Individual — Monorepo (back/front/docker)

#### Visão Geral
Este projeto implementa um sistema de extrato financeiro individual via Magic Link, conforme especificação. Ele é composto por:
- back: Spring Boot 3 (Java 17), JPA/Hibernate, PostgreSQL, Flyway, JWT para Admin, Bucket4j (Rate Limit), Apache Commons CSV.
- front: Angular + PrimeNG + Angular CDK Virtual Scroll (tela pública de extrato).
- docker: Dockerfile e docker-compose para rodar localmente; script de deploy para Cloud Run.

#### Banco de Dados (local)
- DB: extrato_db
- Schema: extrato_sh (criado automaticamente via Flyway)
- Usuário: extrato_user
- Senha: Extrato_pwd#123

Para subir localmente com Docker Compose (db + backend):
```
cd docker
docker compose up --build
```
Back: http://localhost:8080

Se preferir rodar o back via Maven (fora de Docker):
1) crie um PostgreSQL local com as credenciais acima;
2) rode:
```
cd back
mvn spring-boot:run
```

#### Configurações (variáveis de ambiente principais)
- SPRING_DATASOURCE_URL (default: jdbc:postgresql://localhost:5432/extrato_db)
- DB_USERNAME (default: extrato_user)
- DB_PASSWORD (default: Extrato_pwd#123)
- ADMIN_USERNAME (default: admin)
- ADMIN_PASSWORD (default: admin123)
- JWT_SECRET (default: dev-secret-please-change)
- SPRING_PROFILES_ACTIVE (prod para Cloud Run)

#### Endpoints Backend
- POST /api/auth/login — body `{"username","password"}` → retorna `{ token }` para autenticar Admin.
- POST /api/admin/importacao/csv — multipart/form-data `file` (CSV MeuDinheiro) — protegido por JWT.
  - Regra destrutiva (TRUNCATE) da tabela `lancamento`, importação atômica e validações básicas.
- GET /api/admin/pessoas — lista pessoas com seus magic links (slug) — protegido por JWT.
- GET /api/extrato/{primeiroNome}_{numeroMagico} — público, responde 404 se não existir. Rate limit: 10 req/s por IP.

#### Formato do CSV (cabecalhos esperados)
Tipo, Status, Data prevista, Data efetiva, Venc. Fatura, Valor previsto, Valor efetivo, Descrição, Categoria,
Subcategoria, Conta, Conta transferência, Centro, Contato, Forma, Projeto, N. Documento, Observações,
Data competência, ID Único, Tags, Cartão, Repetição, Meta de Economia, Data de criação

- Campos NOT NULL validados conforme especificação. Datas aceitas: `yyyy-MM-dd` ou `dd/MM/yyyy`.
- Valores numéricos aceitam vírgula decimal; ex.: `1.234,56`.

#### Frontend (dev)
Pré-requisitos: Node 18+ e npm.
```
cd front
npm install
npm start
```
- App: http://localhost:4200
- Proxy para backend: `/api` → http://localhost:8080
- Rota pública: `/:slug` (ex.: `/maria_abCdE123...`)
- A tela usa Virtual Scroll e apresenta agrupamento por Projeto e Categoria, ordenado por data (efetiva, senão prevista).

#### Docker/Cloud Run
Dockerfile do backend: `docker/Dockerfile.back` (multi-stage, OpenJDK 17).

Build da imagem (na raiz do repo):
```
docker build -f docker/Dockerfile.back -t gcr.io/SEU_PROJETO/extrato-back:latest .
```

Deploy no Cloud Run (exemplo usando gcloud; ajuste nomes/projeto/região):
```
PROJECT_ID=seu-projeto
REGION=southamerica-east1
SERVICE=extrato-back
IMAGE=gcr.io/$PROJECT_ID/extrato-back:latest

# build & push
gcloud builds submit --tag $IMAGE .

# deploy
gcloud run deploy $SERVICE \
  --region $REGION \
  --image $IMAGE \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars SPRING_PROFILES_ACTIVE=prod,JWT_SECRET=defina-um-segredo-forte,ADMIN_USERNAME=defina,ADMIN_PASSWORD=defina \
  --set-env-vars DB_NAME=extrato_db,DB_USERNAME=extrato_user,DB_PASSWORD='Extrato_pwd#123'
```

Conexão ao Cloud SQL (recomendado): configurar de acordo com sua infra (Cloud SQL Auth Proxy/connector). Mantenha todas as credenciais em variáveis de ambiente (não no código/Dockerfile).

#### Observações de Segurança
- Magic Link: a segurança depende do `numeroMagico` (Base62 com 16 chars, gerado via `SecureRandom`).
- Rate Limiting: 10 req/s por IP em `/api/extrato/**`.
- Admin: Autenticação via JWT. Ajuste o `JWT_SECRET` e credenciais via variáveis de ambiente.

#### Próximos Passos (sugestões)
- Testes unitários (Base62 e NameNormalizer) e testes de integração do ImportacaoService.
- Melhorar mensagens de erro de validação com coleta de múltiplas linhas inválidas (atualmente a importação é atômica e falha ao primeiro erro crítico).
- Empacotar e servir o frontend de forma estática via CDN ou outro serviço gerenciado, apontando para o backend público.
