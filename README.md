# Tronco-viz
**Tronco-viz** è una libreria per la visualizzazione di grafi generati dal pachetto [TRONCO](https://sites.google.com/site/troncopackage/).
La libreria espone i propri metodi attraverso l'oggetto **Troncola**.

## Troncola

L'oggetto **Troncola** contiene propietà che andranno a influire sull'estetica del grafo.
Se esse non sono state definite le verranno assegnati dei valori in automatico.

### Proprietà grafiche

 - scale_factor: Fattore di scala dei nodi del grafo (Default = 0.33)
 - stroke_width: Spessore delle linee degli archi (Default = 2px)
 - font_size: Dimensione in pixel dei testi del grafo (Default = 14px)
 - label_font_name: Nome del font utilizzato per i label di nodi ed archi (Default = Arial)
 - desc_font_name: Nome del font utilizzato per la descrizione di noid ed archi (Default = Courier)

### Funzioni

#### draw_graph(*filename*)

Si occupa della visualizzazione del grafico attraverso l'utilizzio di [d3](https://d3js.org/) e [cola](http://marvl.infotech.monash.edu/webcola/).
La funzione si divide in più fasi:

 - Inizialmente viene letto il file chiamato *filename*, di formato gml. Se il file non viene trovato si genera un errore
 - Vengono letti i tag **<key>** e vengono determinati gli attributi di grafo, nodi ed archi
 - Viene creato l'oggetto graph vero e proprio a cui si assegnano i rispettivi attributi
 - Si utilizza [cola](http://marvl.infotech.monash.edu/webcola/) per calcolare le coordinate dei vari nodi
 - Vengono creati i marker, ovvero le punte delle freccie, nei vari colori e con gli stili definiti nel gml
 - Si utilizza [d3](https://d3js.org/) per inserire nel DOM il grafo
 - Viene associato ai nodi un evento quando il mouse è "hover"