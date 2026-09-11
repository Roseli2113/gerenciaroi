# Corrigir edição de orçamento dos conjuntos

## Alterações
- Adicionar à função da Meta o tratamento que está faltando para `update-adset`, validando o ID e os valores enviados.
- Enviar a alteração de orçamento do conjunto à Meta e devolver o motivo real quando ela rejeitar a operação.
- Fazer a tela mostrar essa mensagem detalhada, em vez do erro genérico de resposta 400.
- Adicionar a descrição acessível ausente ao popup de edição do conjunto.

## Validação
- Verificar os tipos do aplicativo e da função.
- Publicar a função atualizada e confirmar que ela aceita a ação de editar orçamento de conjunto.
