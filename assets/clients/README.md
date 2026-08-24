# Imagens de clientes — modo local

Quando o Supabase estiver conectado, fotos, nomes, seguidores e links devem ser cadastrados pelo `admin.html`.

Esta pasta pode ser usada apenas para simulações locais. Nesse caso, atualize `clients-data.js` usando um caminho como:

```js
{
  name: "Nome do cliente",
  platform: "instagram", // instagram, youtube ou tiktok
  username: "usuario",
  profileUrl: "https://instagram.com/usuario",
  followersCount: 120000,
  profileImageUrl: "./assets/clients/cliente.webp",
  verified: true
}
```
