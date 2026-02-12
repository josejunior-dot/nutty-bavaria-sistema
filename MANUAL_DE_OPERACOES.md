# Manual de Operacoes — Nutty Bavaria Sistema de Gestao

**Versao:** 1.0
**Data:** Fevereiro 2026
**Sistema:** Nutty Bavaria — Sistema de Gestao de Quiosques

---

## Sumario

1. [Visao Geral do Sistema](#1-visao-geral-do-sistema)
2. [Acesso e Login](#2-acesso-e-login)
3. [Perfis de Usuario](#3-perfis-de-usuario)
4. [Dashboard](#4-dashboard)
5. [Caixa](#5-caixa)
6. [Vendas (PDV)](#6-vendas-pdv)
7. [Produtos](#7-produtos)
8. [Estoque](#8-estoque)
9. [Sugestao Inteligente de Compra](#9-sugestao-inteligente-de-compra)
10. [Fiscal](#10-fiscal)
11. [Shopping e Campanhas](#11-shopping-e-campanhas)
12. [Relatorios](#12-relatorios)
13. [Configuracoes](#13-configuracoes)
14. [Fluxo Operacional Diario](#14-fluxo-operacional-diario)
15. [Solucao de Problemas](#15-solucao-de-problemas)

---

## 1. Visao Geral do Sistema

O Nutty Bavaria Sistema e uma plataforma completa de gestao para quiosques de franquia. Ele cobre:

- **Ponto de Venda (PDV)** — registro de vendas com multiplas formas de pagamento
- **Controle de Caixa** — abertura, sangria, suprimento e fechamento
- **Catalogo de Produtos** — cadastro completo com parametros de reposicao
- **Estoque** — entradas, saidas, pedidos de compra e posicao atual
- **Sugestao Inteligente de Compra** — algoritmo com demanda ponderada, classificacao ABC, GMROI, safety stock e sazonalidade
- **Fiscal** — acompanhamento de notas fiscais eletronicas
- **Campanhas de Shopping** — gestao de campanhas e cupons
- **Relatorios** — curva ABC, vendas por periodo, ranking de vendedores, comparativo entre quiosques e comissoes
- **Configuracoes** — usuarios, fornecedores, clientes, terminais e comissoes

### Navegacao

A barra lateral esquerda (sidebar) mostra os modulos disponiveis conforme seu perfil. Ela pode ser recolhida clicando no botao de seta na parte inferior. O cabecalho superior mostra o nome da empresa e o perfil do usuario logado.

---

## 2. Acesso e Login

### Como acessar

1. Abra o navegador e acesse o endereco do sistema (ex: `http://localhost:3002`)
2. Na tela de login, informe seu **e-mail** e **senha**
3. Clique em **"Entrar"**
4. Voce sera redirecionado ao Dashboard

### Credenciais de demonstracao

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Franqueador | franqueador@nutty.com | 123456 |
| Gerente Morumbi | gerente.morumbi@nutty.com | 123456 |
| Gerente Eldorado | gerente.eldorado@nutty.com | 123456 |
| Operadora Morumbi | operadora.morumbi@nutty.com | 123456 |
| Operadora Eldorado | operadora.eldorado@nutty.com | 123456 |

### Logout

Clique no avatar/nome no canto superior direito e selecione **"Sair"**.

---

## 3. Perfis de Usuario

O sistema possui tres perfis com niveis de acesso distintos:

### OPERADORA
- Registrar vendas no PDV
- Visualizar posicao de estoque
- Visualizar entradas e saidas
- Consultar pedidos de compra

### GERENTE
- Tudo da Operadora, mais:
- Abrir e fechar caixa
- Registrar sangrias e suprimentos
- Criar pedidos de compra e receber mercadorias
- Acessar Sugestao Inteligente de Compra
- Gerenciar eventos sazonais
- Criar e gerenciar campanhas de shopping
- Acessar relatorios completos

### FRANQUEADOR
- Tudo do Gerente, mais:
- Comparativo entre quiosques
- Configuracoes do sistema (usuarios, terminais, comissoes)
- Visao consolidada de todas as unidades

---

## 4. Dashboard

O Dashboard e a tela inicial apos o login. Ele apresenta uma visao rapida do desempenho do quiosque.

### KPIs (Indicadores)

| Card | Descricao |
|------|-----------|
| **Vendas Hoje** | Total em R$ das vendas do dia, com variacao percentual vs ontem |
| **Qtd. Vendas** | Numero de vendas realizadas hoje vs ontem |
| **Ticket Medio** | Valor medio por venda (total / quantidade) |
| **Estoque Baixo** | Quantidade de produtos abaixo do estoque minimo. Mostra "Atencao" em vermelho se > 0 |

### Grafico de Vendas

Grafico de barras mostrando o total de vendas dos ultimos **7 dias**. Cada barra exibe o valor em R$ e a data correspondente.

---

## 5. Caixa

O modulo Caixa controla todo o fluxo financeiro do turno.

### 5.1 Abrir Caixa

1. Na pagina **Caixa**, clique em **"Abrir Caixa"**
2. Selecione o **Terminal** no dropdown
3. Informe o **Valor de Abertura** (dinheiro inicial no caixa, ex: R$ 200,00)
4. Clique em **"Abrir"**
5. Os cards de resumo aparecerao com o saldo

> **Importante:** O caixa deve estar aberto para registrar vendas no PDV.

### 5.2 Sangria (Retirada de Dinheiro)

Utilizada para retirar dinheiro do caixa (ex: deposito bancario, troco excedente).

1. Clique em **"Sangria"**
2. Informe o **Valor** da retirada
3. Informe o **Motivo** (ex: "Deposito bancario")
4. Clique em **"Confirmar"**

### 5.3 Suprimento (Deposito de Dinheiro)

Utilizado para adicionar dinheiro ao caixa (ex: troco adicional).

1. Clique em **"Suprimento"**
2. Informe o **Valor**
3. Informe o **Motivo** (ex: "Troco adicional")
4. Clique em **"Confirmar"**

### 5.4 Fechar Caixa

1. Clique em **"Fechar Caixa"** (botao vermelho)
2. O sistema mostra o **saldo esperado** (abertura + vendas + suprimentos - sangrias)
3. Conte fisicamente o dinheiro no caixa
4. Informe o **Valor em Caixa** (valor real contado)
5. Clique em **"Fechar Caixa"**

> A diferenca entre o valor esperado e o informado indica sobra ou falta de caixa.

### 5.5 Historico de Movimentos

Abaixo dos cards de resumo, uma tabela mostra todas as operacoes do turno (sangrias e suprimentos), e o historico de movimentos anteriores com status, terminal, operador, horario e quantidade de vendas.

---

## 6. Vendas (PDV)

O modulo de Vendas funciona como um Ponto de Venda (PDV) digital.

### 6.1 Registrar uma Venda

1. Acesse **Vendas**
2. Verifique se o caixa esta aberto (se nao, um alerta amarelo aparece)
3. **Busque o produto** digitando nome ou codigo na barra de busca
4. **Clique no produto** desejado no grid — ele sera adicionado ao carrinho
5. **Ajuste a quantidade** usando os botoes **+** e **-** no carrinho
6. Repita para cada produto desejado
7. Se necessario, informe um **desconto** no campo "Desconto"
8. Clique em **"Pagamento"**

### 6.2 Registrar Pagamento

1. Na tela de pagamento, selecione a **forma de pagamento**:
   - DINHEIRO
   - CREDITO (Cartao de Credito)
   - DEBITO (Cartao de Debito)
   - PIX
   - VOUCHER
2. Informe o **valor** (ou use o botao de pagamento rapido para valor total)
3. Clique em **"Add"** para adicionar o pagamento
4. Para **pagamento misto**: repita o processo com outra forma
5. O sistema mostra:
   - **Pago**: total ja registrado
   - **Restante**: quanto falta
   - **Troco**: se o valor pago exceder o total (ex: pagamento em dinheiro)
6. Quando o Restante for R$ 0,00, clique em **"Finalizar Venda"**

### 6.3 Historico de Vendas

Clique em **"Historico"** no canto superior direito para ver as ultimas 20 vendas com numero, status, quantidade de itens, total e data.

---

## 7. Produtos

O modulo Produtos gerencia o catalogo completo de itens vendidos pelo quiosque.

### 7.1 Cadastrar Produto

1. Acesse **Produtos** e clique em **"Novo Produto"**
2. Preencha os campos obrigatorios:
   - **Nome**: nome do produto (ex: "Castanha de Caju 200g")
   - **Codigo**: codigo unico (ex: "CAJU200")
   - **Unidade**: UN, KG, G, L, ML ou PCT
   - **Preco Venda**: preco de venda ao consumidor
3. Campos opcionais:
   - **Preco Custo**: custo de aquisicao (usado no calculo do GMROI)
   - **Estoque Atual**: quantidade em estoque
   - **Estoque Minimo**: nivel de alerta para reposicao
4. **Campos de reposicao** (usados pela Sugestao Inteligente):
   - **Lead Time (dias)**: tempo entre o pedido e o recebimento (ex: 7)
   - **Lote Minimo**: quantidade minima por pedido ao fornecedor (ex: 10)
   - **Cobertura (dias)**: quantos dias de estoque manter (ex: 30)
   - **Fornecedor Padrao**: selecione o fornecedor preferido
5. Clique em **"Salvar"**

### 7.2 Editar Produto

1. Na lista de produtos, clique no icone de **lapis** ao lado do produto
2. Altere os campos desejados
3. Clique em **"Salvar"**

### 7.3 Desativar Produto

1. Clique no icone de **lixeira** ao lado do produto
2. Confirme a desativacao
3. O produto sera marcado como "Inativo" e nao aparecera no PDV

### 7.4 Busca e Paginacao

- Use a **barra de busca** para filtrar por nome ou codigo
- Use os botoes **Anterior/Proxima** para navegar entre paginas (20 itens por pagina)

---

## 8. Estoque

O modulo Estoque oferece controle completo das movimentacoes de mercadoria.

### 8.1 Aba "Posicao"

Mostra todos os produtos com:
- **Estoque Atual** (vermelho se abaixo do minimo)
- **Estoque Minimo**
- **Barra de Nivel** (verde = OK, vermelho = baixo)
- **Status**: OK, Baixo ou Inativo

Um alerta amarelo no topo indica quantos produtos estao com estoque baixo.

### 8.2 Aba "Entradas"

Historico de todas as entradas de mercadoria, com:
- Data
- Fornecedor
- Numero da Nota
- Itens recebidos (produto, quantidade, preco unitario)
- Observacao

### 8.3 Aba "Saidas"

Historico de saidas de estoque (perdas, danos, ajustes), com:
- Data
- Motivo
- Itens
- Observacao

### 8.4 Aba "Pedidos"

Gerencia os pedidos de compra:

| Status | Descricao |
|--------|-----------|
| **RASCUNHO** | Pedido criado, ainda nao enviado |
| **ENVIADO** | Pedido enviado ao fornecedor |
| **RECEBIDO** | Mercadoria recebida e estoque atualizado |
| **CANCELADO** | Pedido cancelado |

**Receber um pedido:**
1. Localize o pedido com status "ENVIADO"
2. Clique em **"Receber"**
3. O sistema automaticamente:
   - Marca o pedido como RECEBIDO
   - Cria uma entrada de estoque
   - Atualiza o estoque de cada produto

---

## 9. Sugestao Inteligente de Compra

A aba **"Sugestao Inteligente"** no modulo Estoque e o coracao analitico do sistema. Ela calcula automaticamente o que comprar, quanto comprar e quando comprar.

> **Acesso:** Gerente ou Franqueador apenas.

### 9.1 Como Funciona o Algoritmo

O sistema analisa os ultimos **90 dias de vendas** e calcula:

1. **Demanda Ponderada (WMA)**
   - Ultimos 30 dias: peso 3 (mais relevante)
   - 31-60 dias: peso 2
   - 61-90 dias: peso 1
   - Resultado: demanda diaria media ponderada

2. **Classificacao ABC (Pareto)**
   - **Classe A**: produtos que representam ate 80% da receita (os mais importantes)
   - **Classe B**: de 80% a 95% da receita
   - **Classe C**: acima de 95% (menor impacto)

3. **Safety Stock (Estoque de Seguranca)**
   - Classe A: nivel de servico 95% (Z = 1,65)
   - Classe B: nivel de servico 90% (Z = 1,28)
   - Classe C: nivel de servico 85% (Z = 1,04)
   - Formula: Z x desvio padrao x raiz quadrada do lead time

4. **GMROI (Retorno sobre Investimento em Estoque)**
   - Formula: (margem% x receita anualizada) / (custo x estoque medio)
   - Quanto maior, melhor o retorno — produtos sao ordenados por GMROI

5. **Ajuste Sazonal**
   - Se um evento sazonal esta ativo no periodo de cobertura, a demanda e multiplicada pelo fator do evento

6. **Ponto de Reposicao**
   - (demanda ajustada x lead time) + safety stock

### 9.2 Os 3 Cenarios

O sistema gera tres cenarios de compra:

| Cenario | Safety Stock | Cobertura | Descricao |
|---------|-------------|-----------|-----------|
| **Conservador** | 80% | 80% | Menor investimento, maior risco de ruptura |
| **Moderado** | 100% | 100% | Equilibrio entre custo e seguranca |
| **Agressivo** | 130% | 120% | Maior investimento, menor risco de ruptura |

Cada cenario mostra:
- **Investimento total** (soma dos custos de todos os itens sugeridos)
- **Quantidade de itens** com sugestao de compra
- **Cobertura media** em dias

**Clique no card do cenario** para seleciona-lo. A tabela abaixo atualiza com os valores do cenario escolhido.

### 9.3 Tabela de Sugestoes

A tabela mostra, para cada produto:

| Coluna | Descricao |
|--------|-----------|
| Produto | Nome, codigo e badge de evento sazonal (se ativo) |
| ABC | Classificacao A, B ou C |
| Estoque | Quantidade atual / minimo |
| Demanda/dia | Demanda diaria ajustada |
| Lead Time | Dias do pedido ate recebimento |
| Safety Stock | Estoque de seguranca calculado |
| GMROI | Retorno sobre investimento (verde >= 2, amarelo >= 1, vermelho < 1) |
| Qtd Sugerida | Quantidade recomendada para compra |
| Custo | Custo total da quantidade sugerida |
| Cobertura | Dias de estoque que a compra cobrira |

> A tabela e ordenada por **GMROI decrescente** — priorize os itens do topo.

### 9.4 Eventos Sazonais

Eventos sazonais ajustam a demanda para periodos especiais (Natal, Pascoa, Dia das Maes, etc.).

**Criar um evento:**

1. Na aba Sugestao Inteligente, clique em **"Eventos Sazonais"**
2. No formulario na parte inferior do dialog:
   - **Nome**: ex: "Natal 2026"
   - **Data Inicio**: ex: 01/12/2026
   - **Data Fim**: ex: 26/12/2026
   - **Multiplicador**: fator de ajuste da demanda (ex: 1.5 = +50%, 2.0 = +100%)
   - **Recorrente (anual)**: marque se o evento se repete todo ano
3. Clique em **"Criar"**

**Exemplos de multiplicadores:**

| Evento | Multiplicador Sugerido |
|--------|----------------------|
| Natal | 1.8 - 2.5 |
| Pascoa | 1.5 - 2.0 |
| Dia das Maes | 1.3 - 1.5 |
| Black Friday | 1.5 - 2.0 |
| Ferias Escolares | 1.2 - 1.4 |
| Janeiro (pos-festas) | 0.7 - 0.9 |

> Eventos recorrentes ajustam automaticamente o ano. O sistema verifica se o evento se sobrepoem ao periodo de cobertura do produto.

### 9.5 Gerar Pedido de Compra

1. Selecione o cenario desejado (Conservador, Moderado ou Agressivo)
2. Clique em **"Gerar Pedido"**
3. O sistema cria automaticamente um Pedido de Compra com todos os itens sugeridos
4. O pedido aparece na aba **Pedidos** com status RASCUNHO
5. Para **recalcular** as sugestoes, clique em **"Recalcular"**

---

## 10. Fiscal

O modulo Fiscal acompanha as notas fiscais eletronicas.

### KPIs

- **Emitidas**: notas emitidas com sucesso (verde)
- **Pendentes**: aguardando processamento (amarelo)
- **Rejeitadas**: rejeitadas pela SEFAZ (vermelho)

### Acoes

| Status | Acoes Disponiveis |
|--------|-------------------|
| PENDENTE | Cancelar |
| EMITIDA | Cancelar |
| REJEITADA | Reenviar |
| CANCELADA | Nenhuma |

- **Reenviar**: retransmite a nota rejeitada para a SEFAZ
- **Cancelar**: cancela a nota fiscal (pede confirmacao)

---

## 11. Shopping e Campanhas

O modulo Shopping gerencia campanhas promocionais vinculadas a shoppings.

### Criar Campanha

1. Acesse **Shopping** e clique em **"Nova Campanha"**
2. Preencha:
   - **Nome**: nome da campanha (ex: "Natal 2026 - Shopping Morumbi")
   - **Descricao**: detalhes da campanha (opcional)
   - **Data Inicio / Data Fim**: periodo de vigencia
   - **Valor Minimo**: valor minimo de compra para gerar cupom (ex: R$ 50,00)
   - **Campanha ativa**: ative ou desative
3. Clique em **"Salvar"**

### Editar Campanha

Clique no icone de lapis ao lado da campanha e altere os campos desejados.

---

## 12. Relatorios

O modulo de Relatorios oferece cinco tipos de analise.

### Filtro de Periodo

Todas as abas utilizam o mesmo filtro de datas no topo:
1. Selecione a **data inicial** ("De")
2. Selecione a **data final** ("Ate")
3. Clique em **"Buscar"**

O sistema carrega automaticamente os dados da aba selecionada ao alterar abas.

### 12.1 Curva ABC

Classifica os produtos por importancia na receita:
- **Classe A**: produtos que geram ate 80% da receita (foco maximo)
- **Classe B**: 80% a 95% da receita
- **Classe C**: acima de 95% (menor impacto)

Colunas: Produto | Total Vendido (R$) | % | % Acumulado | Classe

> Use esta analise para priorizar reposicao e negociacao com fornecedores.

### 12.2 Vendas por Periodo

Mostra o total de vendas e quantidade de transacoes por dia no periodo selecionado.

Colunas: Data | Total (R$) | Quantidade de Vendas

> Identifique dias de pico e dias fracos para planejamento de equipe.

### 12.3 Ranking de Vendedores

Classifica os vendedores pelo desempenho no periodo.

Colunas: Posicao | Vendedor | Total Vendas (R$) | Qtd. Vendas

### 12.4 Comparativo entre Quiosques

Compara o desempenho de diferentes unidades (Morumbi vs Eldorado, etc.).

Colunas: Quiosque | Total Vendas (R$) | Ticket Medio (R$) | Qtd. Vendas

> Disponivel apenas para o perfil FRANQUEADOR.

### 12.5 Comissoes

Calcula automaticamente as comissoes dos vendedores com base nas taxas configuradas.

Colunas: Vendedor | Total Vendas (R$) | Qtd. | % Comissao | Comissao (R$)

---

## 13. Configuracoes

O modulo de Configuracoes permite gerenciar entidades do sistema.

> **Acesso:** Gerente e Franqueador.

### 13.1 Usuarios

Cadastre, edite ou remova usuarios do sistema.

**Campos:**
- Nome
- E-mail (usado para login)
- Perfil: OPERADORA, GERENTE ou FRANQUEADOR
- Senha (obrigatoria para novos usuarios; ao editar, deixe em branco para manter a atual)

### 13.2 Fornecedores

Cadastre os fornecedores de mercadoria.

**Campos:** Nome, CNPJ (opcional), Telefone (opcional), E-mail (opcional)

> Fornecedores cadastrados aqui aparecem como opcao de "Fornecedor Padrao" no cadastro de Produtos.

### 13.3 Clientes

Cadastre clientes para vincular a vendas e campanhas.

**Campos:** Nome, CPF (opcional), Telefone (opcional), E-mail (opcional)

### 13.4 Terminais

Gerencie os terminais (pontos de venda) do quiosque.

**Campos:** Nome (ex: "Caixa 1") e Codigo (ex: "T1-MOR")

> Terminais sao selecionados na abertura do caixa.

### 13.5 Comissoes

Configure as faixas de comissao para vendedores.

**Campos:** Nome (ex: "Padrao", "Premium") e Percentual (ex: 5%)

---

## 14. Fluxo Operacional Diario

### Abertura (Inicio do Turno)

1. **Login** no sistema
2. **Abrir Caixa**: selecionar terminal e informar valor de abertura
3. Verificar **Dashboard**: conferir alertas de estoque baixo

### Durante o Dia

4. **Registrar vendas** no PDV
5. **Sangrias** quando necessario (depositos, retiradas)
6. **Suprimentos** se precisar de troco adicional
7. Monitorar o **estoque** na aba Posicao

### Fechamento (Fim do Turno)

8. **Fechar Caixa**: contar dinheiro fisico e informar valor
9. Conferir o **resumo do dia** no Dashboard
10. Verificar **relatorios** se necessario

### Semanal/Mensal

11. Analisar **Sugestao Inteligente de Compra**
12. **Gerar pedidos** de reposicao
13. Cadastrar/atualizar **eventos sazonais** para periodos especiais
14. Conferir **relatorio de comissoes** para pagamento
15. Analisar **curva ABC** para ajustar mix de produtos
16. Comparar desempenho entre quiosques (Franqueador)

---

## 15. Solucao de Problemas

### "Caixa fechado" ao tentar registrar venda

**Causa:** Nenhum caixa aberto para o terminal.
**Solucao:** Va ate **Caixa** e clique em **"Abrir Caixa"**.

### Produto nao aparece no PDV

**Causa:** O produto pode estar inativo.
**Solucao:** Va ate **Produtos**, busque o produto e verifique se o status e "Ativo". Se estiver "Inativo", edite e reative.

### Sugestao Inteligente mostra "Nenhuma sugestao"

**Causa:** O sistema precisa de historico de vendas e produtos cadastrados para gerar analises.
**Solucao:**
- Verifique se existem produtos ativos cadastrados
- Verifique se existem vendas nos ultimos 90 dias
- Preencha os campos de Lead Time, Lote Minimo e Cobertura nos produtos

### GMROI aparece como 0.00

**Causa:** O produto nao tem preco de custo cadastrado.
**Solucao:** Edite o produto em **Produtos** e informe o **Preco Custo**.

### Nota fiscal rejeitada

**Causa:** Dados inconsistentes ou problema de comunicacao com a SEFAZ.
**Solucao:** Clique no botao **"Reenviar"** na aba Fiscal. Se persistir, verifique os dados cadastrais da empresa.

### Erro "Estoque insuficiente" ao criar saida

**Causa:** Tentativa de saida maior que o estoque disponivel.
**Solucao:** Verifique o estoque atual do produto na aba **Posicao** e ajuste a quantidade.

### Nao consigo acessar Sugestao Inteligente / Configuracoes

**Causa:** Seu perfil nao tem permissao.
**Solucao:** Solicite ao Gerente ou Franqueador que ajuste seu perfil em **Configuracoes > Usuarios**.

---

*Nutty Bavaria Sistema de Gestao — Todos os direitos reservados.*
