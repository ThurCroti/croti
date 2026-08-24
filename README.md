# CROTI — portfólio e painel de conteúdo

O site continua sendo HTML/CSS/JavaScript estático, mas vídeos, clientes, depoimentos e leads são gerenciados pelo Supabase.

## Arquitetura

- `index.html`: portfólio público.
- `catalog-data.js`: dados centralizados, categorias e conversão dos vídeos do CMS para o Video Catalog.
- `admin.html`: painel privado completo de conteúdo.
- `cms.js`: conexão compartilhada com o Supabase.
- `supabase-config.js`: URL e chave pública do projeto.
- `supabase-schema.sql`: tabelas, bucket e regras de segurança.
- `vendor/`: clientes Supabase e TUS versionados localmente, sem dependência de CDN em produção.

O painel permite:

- login com e-mail e senha;
- upload retomável de MP4/WebM e capa;
- criação e edição de trabalhos Long Form, Short Form ou Showreel/VSL;
- ano, descrição, serviços, proporção e cliente de cada trabalho;
- publicação e ocultação;
- reordenação visual;
- exclusão do registro e dos arquivos.
- cadastro manual de clientes do Instagram, YouTube ou TikTok com nome, foto e métricas;
- selo verificado automático em todos os clientes;
- edição, publicação, ordenação e exclusão dos perfis no slideshow;
- cadastro e edição de depoimentos com foto, cargo, texto e ordem;
- resumo em tempo real do total e dos itens publicados.

## Video Catalog

Quando o Supabase está configurado e possui vídeos publicados, o catálogo usa esses itens automaticamente. Sem conteúdo remoto, ele mostra os projetos locais de exemplo definidos em `catalog-data.js`.

Para adicionar ou substituir projetos locais, edite apenas o array `projects`. Cada objeto aceita título, cliente, categoria, ano, thumbnail, vídeo, poster, descrição, serviços, destaque e proporção.

## Configurar o Supabase

1. Crie um projeto em <https://supabase.com>.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase-schema.sql` e execute. O arquivo pode ser executado novamente para atualizar uma instalação anterior.
3. Em **Authentication > Users**, crie seu usuário administrador.
4. Copie o UUID desse usuário e execute no SQL Editor:

   ```sql
   insert into public.admins (user_id)
   values ('UUID_DO_SEU_USUARIO');
   ```

5. Em **Project Settings > API**, copie a Project URL e a chave `anon`/`publishable`.
6. Preencha os dois valores em `supabase-config.js`.

Depois disso, acesse `/admin.html`, entre com o usuário criado e use os botões **Novo trabalho**, **Cliente** e **Depoimento**. Conteúdos marcados como publicados aparecem automaticamente no portfólio; se ainda não houver registros remotos, o site mantém os exemplos locais como fallback.

A chave pública pode ficar no frontend. Upload e exclusão só são liberados pelas policies para usuários presentes em `public.admins`. Nunca coloque a `service_role` neste projeto.

## Rodar localmente

Na pasta do projeto:

```bash
python3 -m http.server 4173
```

Abra:

- Portfólio: <http://localhost:4173/>
- Painel: <http://localhost:4173/admin.html>

## Preparar vídeos

Para boa performance, use preferencialmente:

- MP4 com H.264;
- 1080p para projetos horizontais;
- 1080 × 1920 para shorts verticais;
- bitrate aproximado de 4–8 Mbps;
- capa WebP ou JPG abaixo de 300 KB;
- vídeos curtos nos cards e versão completa apenas no player principal.

O limite inicial é 50 MB por arquivo, compatível com o plano gratuito do Supabase. No plano Pro, aumente o limite global em **Storage > Settings**, o `file_size_limit` do bucket e `maxUploadMB` em `supabase-config.js`.
O painel usa o protocolo TUS para que uploads grandes possam continuar após oscilações de conexão.

## Publicação

Hospede os arquivos estáticos em Netlify, Vercel, Cloudflare Pages ou serviço equivalente. O backend permanece no Supabase; não é necessário manter um servidor Node próprio.
