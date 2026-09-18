# storage/livros

PDFs postados pela turma, um por livro. Esta pasta fica **fora de `public/`**:
os arquivos só são servidos pela rota `/api/arquivos/<id>`, atrás da senha da
turma. Nada aqui é versionado no Git.

Para publicar um PDF:

1. Copie o arquivo para esta pasta, ex.: `bates-propedeutica-medica-essencial.pdf`.
2. Em `src/lib/data/books.ts`, no registro do livro, adicione:

   ```ts
   file: {
     path: "bates-propedeutica-medica-essencial.pdf",
     origin: "Enviado por <nome>, cópia própria",
     authorization: "<em que base a turma pode usar este arquivo>",
     addedAt: "2026-09-20",
   },
   ```

3. Rode `npm run build`. O livro passa a mostrar "Ler PDF" e "Baixar".

Para tirar um livro do catálogo sem apagar o registro, use `visibility: "oculto"`.
