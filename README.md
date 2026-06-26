# Médias do IFRJ

Calculadora simples para notas do IFRJ. Ela calcula notas do Ensino Médio/Técnico e da Graduação com base no PDF oficial de notas e frequências, mostrando também a média final no SIGAA.

## Objetivo

Este projeto é um fork do [mediasIFRJ](https://fonsmat.github.io/mediasIFRJ/), ferramenta muito utilizada pelos alunos do meu campus para calcular médias escolares.

A versão original possui alguns erros nos cálculos, especialmente em casos de recuperação. Por isso, este fork tem como objetivo corrigir esses problemas, melhorar a precisão dos resultados e adicionar suporte para alunos da graduação.

Após realizar as correções e melhorias, divulguei a ferramenta para os alunos do meu campus, com o objetivo de facilitar o acompanhamento das notas e oferecer uma alternativa mais confiável para o cálculo das médias.

## Como funciona?

O período letivo é dividido em semestres, denominados períodos. Cada período tem dois bimestres: o primeiro é chamado de MV1, e o segundo de MV2.

### Ensino Médio/Técnico

Segundo o PDF oficial de notas e frequências do IFRJ, no Técnico Integrado a nota do período regular é chamada de G2:

```text
G2 = (MV1 + 2 * MV2) / 3
```

Se o G2 for menor que 6,0, o aluno faz recuperação final. A nota da recuperação é MVR e o grau final é:

```text
GF = (G2 + 1,5 * MVR) / 2,5
```

No caso da EJA, o PDF também informa recuperação paralela obrigatória para MV1 menor que 6,0. Nos demais cursos técnicos, a recuperação paralela é opcional:

```text
G1 = (MV1 + 1,5 * MVRP) / 2,5
```

Por padrão, a aplicação não considera arredondamento no Ensino Médio/Técnico. Ela mira 6,0 real para indicar uma aprovação mais segura, por exemplo: G1 6,0 e G2 6,0.

Existe uma opção chamada "Considerar possível arredondamento SIGAA". Quando marcada, a calculadora considera o arredondamento para o meio ponto mais próximo. Por exemplo: 9,33 aparece como 9,5, mas uma média abaixo de 5,75 ainda cai para 5,5.

### Graduação

Na graduação, a média regular é chamada de M. Se M for menor que 6,0 e maior ou igual a 4,0, o aluno faz Verificação Suplementar (VS):

```text
MF = (M + VS) / 2
```

Segundo o PDF, a graduação não tem arredondamento no SIGAA, nem mesmo para 5,9. Por isso, a média final no SIGAA é mostrada sem arredondamento, e a aprovação exige MF maior ou igual a 6,0.

Fonte: [PDF oficial de notas e frequências do IFRJ](https://portal.ifrj.edu.br/sites/default/files/IFRJ/Rio%20de%20Janeiro/Ensino/Alunos/notas_e_frequencias.pdf).

## Créditos

Projeto original por Matheus Fonseca, aluno do IFRJ-CPar, 2020.1.

Adaptação, correções e melhorias desta versão pelo mantenedor deste fork.

![IFRJ](https://github.com/FonsMat123/mediasIFRJ/blob/master/img/if.png)
