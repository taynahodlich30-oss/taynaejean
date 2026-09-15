# Chá de Casa Nova — Tayná & Jean

Site responsivo para a lista de presentes de Tayná & Jean, pronto para publicação no GitHub Pages.

## Arquivos

- `index.html` — página principal
- `style.css` — visual responsivo
- `script.js` — busca, filtros e sistema de presentes escolhidos
- `products.json` — lista de produtos e links
- `README.md` — este guia

## 1. Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `cha-de-casa-nova`.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Salve e aguarde o GitHub gerar o endereço do site.

## 2. Firebase/Firestore — para sincronizar "Já comprei"

Sem Firebase, o site salva a seleção somente no navegador da pessoa. Para que **todos os convidados vejam o mesmo presente como "Já escolhido"**, configure o Firestore.

### Criar o projeto

1. Entre no console do Firebase.
2. Crie um novo projeto.
3. Adicione um aplicativo Web (`</>`).
4. Copie o objeto de configuração que o Firebase fornecer.
5. Abra `script.js` e substitua os valores dentro de `FIREBASE_CONFIG`.

### Criar o Firestore

1. No Firebase, abra **Firestore Database**.
2. Clique em **Create database**.
3. Escolha o modo de produção.
4. Depois, abra **Rules** e publique regras que permitam leitura e criação das seleções.

Para um chá de casa nova simples, uma configuração inicial pode ser:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /giftSelections/{giftId} {
      allow read: if true;
      allow create: if !exists(/databases/$(database)/documents/giftSelections/$(giftId));
      allow update, delete: if false;
    }
  }
}
```

Essas regras fazem uma coisa importante: depois que um presente é registrado, outro visitante não consegue sobrescrever a seleção.

### Cole a configuração

No `script.js`, encontre:

```js
const FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};
```

Substitua pelos dados do seu aplicativo Web Firebase.

## 3. Observação importante

Mercado Livre, Shopee e Amazon não avisam automaticamente este site quando uma compra é feita. Por isso, o convidado precisa comprar no link e depois voltar ao site e clicar em **Já comprei**.

O site usa uma transação no Firestore para evitar que duas pessoas confirmem o mesmo presente ao mesmo tempo.

## Lista

A lista foi montada a partir do arquivo de produtos enviado para esta conversa. Os preços são os valores informados no momento em que a lista foi enviada e podem mudar nas lojas.
