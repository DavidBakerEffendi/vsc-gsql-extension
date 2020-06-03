# VSC GSQL Extension

This extensions provides syntax highlighting capabilities for TigerGraph's GSQL. This is mostly hacked together from:
* [alejandropoveda/atom-language-gsql](https://github.com/alejandropoveda/atom-language-gsql)
* [jmeekhof/gsql-vim](https://github.com/jmeekhof/gsql-vim)
* [fjblau/gsql-sublime](https://github.com/fjblau/gsql-sublime)

NOTE! This is still in development and has quite a bit of work and testing to do

## Features

### Syntax Highlighting

![ConnComp Syntax ](./images/conn_comp_file.png)

![feature X](./images/pageRank_file.png)

`syntaxes/gsql.tmLanguage.json` contains a ported version of [alejandropoveda/atom-language-gsql](https://github.com/alejandropoveda/atom-language-gsql)'s specification of GSQL's language spec.

### Linting

TODO: Implement GSQL linting TypeScript from GraphStudio code given to me by @jonherke

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Known Issues

TODO

## Release Notes

### 0.0.1

Initial release supporting basic syntax highlighting
