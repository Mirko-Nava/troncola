!function() {

// Variabili Private

	var graph_width = undefined;		// larghezza teorica del grafico
	var graph_height = undefined;		// altezza teorica del grafico
	var width_delta = 17;				// differenza tra la larghezza teorica del grafico e quella effettiva
	var container_width = undefined;
	var container_height = undefined;

	var Troncola = {
		
// Variabili Pubbliche
		
		"graph_margin":		0,			// Pixel di margine ai lati
		"scale_factor":		0.33,		// Fattore di scala per i nodi
		"stroke_width":		2,			// Spessore linee
		"font_size":		14,			// Dimensione font in px
		"label_font_name":	"arial",	// Font dei label dei nodi
		"desc_font_name":	"courier",	// Font delle descrizioni dei nodi

// Funzioni

		"draw_graph": function(filename) {
			
		// Eventi
		
			function node_over(d, i) {
				d3.select(this).select(".node_label").transition()
				  .attr({
					"y": Troncola.font_size / 2 - graph.nodes[i].height / 2
				  });
				  
				d3.select(this).select(".node_desc")
				  .style({
					"visibility": "visible"
				  })
				  .transition()
				  .style({
					  "font-size": Troncola.font_size + "px"
				  });
				  
				d3.select(this).select(".node").transition()
				  .attr({
					"rx": d.width * Troncola.scale_factor * 2,
					"ry": d.width * Troncola.scale_factor * 2
				  });
			}

			function node_out(d, i) {
				d3.select(this).select(".node_label").transition()
				  .attr({
					"y": Troncola.font_size / 2
				  });
				  
				d3.select(this).select(".node_desc")
				  .transition()
				  .style({
					  "font-size": "0px"
				  })
				  .each("end", function() {
					  d3.select(this).style({
						"visibility": "hidden"
					  });
				  });
				  
				d3.select(this).select(".node").transition()
				  .attr({
					"rx": d.width * Troncola.scale_factor,
					"ry": d.width * Troncola.scale_factor
				  });
			}
			
			function edge_over(d, i) {
				d3.select(this).select(".edge_label_bg").transition()
				  .style({
					  "fill": "#FFFF00"
				  })
			}
			
			function edge_out(d, i) {
				d3.select(this).select(".edge_label_bg").transition()
				  .style({
					  "fill": "#FFFFFF"
				  })
			}
			
		// Generazione grafico
		
			function make_graph(graph_tag, keys) {
				var graph = {};
				
				var graph_attr = [].slice.call(graph_tag.querySelectorAll("data"))	// estraggo attributi del grafo
				.filter(function(tag) {
					return tag.parentElement.tagName === "graph";
				});
				
				graph_attr.forEach(function(tag) {						// associo agli attributi del grafo i relativi valori
					var key = keys.graph[tag.getAttribute("key")];
					var value = tag.textContent;
					if (key.type === "double")
						value = +value;
					graph[key.name] = value;
				});
				
				var nodes = [].map.call(graph_tag.querySelectorAll("node"), function(tag) { // per ogni nodo
					var node = {
						"id": tag.getAttribute("id")
					};
					
					var node_attr = [].slice.call(tag.querySelectorAll("data"));	// estraggo attributi del nodo

					node_attr.forEach(function(tag) {					// associo agli attributi del nodo i relativi valori
						var key = keys.node[tag.getAttribute("key")];
						var value = tag.textContent;
						if (key.type === "double")
							value = +value;
						node[key.name] = value;
					});
					
					return node;
				});
				
				var edges = [].map.call(graph_tag.querySelectorAll("edge"), function(tag) {	// per ogni arco
					var edge = {
						"source": arrayObjectIndexOf(nodes, "id", tag.getAttribute("source")),
						"target": arrayObjectIndexOf(nodes, "id", tag.getAttribute("target"))
					};
					
					var edge_attr = [].slice.call(tag.querySelectorAll("data"));	// estraggo attributi dell'arco

					edge_attr.forEach(function(tag) {					// associo agli attributi dell'arco i relativi valori
						var key = keys.edge[tag.getAttribute("key")];
						var value = tag.textContent;
						if (key.type === "double")
							value = +value;
						edge[key.name] = value;
					});
					
					return edge;
				});
				
				graph.nodes = nodes;
				graph.edges = edges;
				return graph;
			}
			
			function position_graph(graph) {			
				var g = new dagre.graphlib.Graph();
				
				var grafo = {			// attributi che influiscono sull'estetica del grafico
					"rankdir": "TB",
					//"align": "UR",	//note: la documentazione dice TB, ma non è un valore valido, qualunque valore valido != quello di default
					"nodesep": 10,
					"edgesep": 10,
					"ranksep": 50,
					"marginx": Troncola.graph_margin,
					"marginy": Troncola.graph_margin
				};

				g.setGraph(grafo);
				
				g.setDefaultEdgeLabel(function() { return {}; });
				
				graph.nodes.forEach(function(n, i) {
					g.setNode(i, n);
				});
				
				graph.edges.forEach(function(e) {
					g.setEdge(e.source, e.target, e);
				});
				
				dagre.layout(g);	// questa funzione definisce in automatico x ed y dei nodi
				
				graph.edges.forEach(function(e) {	// rimuovo proprietà non usata dagli edge
					delete e.points;
				});
				
				graph_width = grafo.width;
				graph_height = grafo.height;
			}

			function cola_position_graph(graph) {
				var d3cola = cola.d3adaptor()
				  .avoidOverlaps(true)
				  .size([container_width, container_height]);
				  
				d3cola
 				  .nodes(graph.nodes)
				  .links(graph.edges)         
				  .constraints(graph.constraints)
				  .flowLayout("y", 200)
				  .symmetricDiffLinkLengths(40)
				  .start(10, 20, 30);
				
				//d3cola.on("tick", function() {} );
				
				graph_width = container_width;
				graph_height = container_height;
			}
			
			function gen_markers(defs, graph) {
				
				var colors = [];	// array che contiene i possibili colori delle frecce
				
				//note: se utilizzo oggetti posso aggiungere anche frecce speciali (dashed, forme speciali, ...)
				graph.edges.forEach(function(edge) {
					if (edge.arrow === "True") {
						var color = edge.color;
						if (colors.indexOf(color) === -1) {
							colors.push(color);
						}
					}
				});
				
				var max_size = d3.max(graph.nodes, function(n) { return Math.max(n.width, n.height); });	// dimensione massima di un nodo
				
				colors.forEach(function(color) {	// creo freccia per ogni colore
					defs.append("marker")
					  .attr({
						"id": "arrow-" + color.substring(1),
						"viewBox": "0 -7 10 14",
						"refX": 10 + max_size * Troncola.scale_factor,
						"refY": 0,
						"markerWidth": 5,
						"markerHeight": 7,
						"orient": "auto",
						"markerUnits": "strokeWidth"
					  })
					.append("path")
					  .attr("d", "M0,-7 L10,0 L0,7")
					  .style({
						  "fill": "none",
						  "stroke": color,
						  "stroke-width": Troncola.stroke_width + "px"
					  });
				});
			}

			function arrayObjectIndexOf(myArray, property, searchTerm) {	// ritorna l'indice dell'elemento che ha la proprietà === valore
				for(var i = 0, len = myArray.length; i < len; i++) {
					if (myArray[i][property] === searchTerm) return i;
				}
				return -1;
			}
			
		// Codice
			
			d3.xml(filename, function(error, data) {
				if (error) throw error;
				
				var temp = [].map.call(data.querySelectorAll("key"), function(tag) {
					return {
						"id": tag.getAttribute("id"),
						"for": tag.getAttribute("for"),
						"name": tag.getAttribute("attr.name"),
						"type": tag.getAttribute("attr.type")
					};
				});
				
				var keys = {		// keys conterrà le chiavi del documento xml, viene usato per generare gli attributi del grafico
					"graph": {},
					"node": {},
					"edge": {}
				};
				
				temp.forEach(function(key) {
					switch (key.for) {
						case "graph": {
							keys.graph[key.id] = {
								"name": key.name,
								"type": key.type
							}
							break;
						}
						case "node": {
							keys.node[key.id] = {
								"name": key.name,
								"type": key.type
							}
							break;
						}
						case "edge": {
							keys.edge[key.id] = {
								"name": key.name,
								"type": key.type
							}
							break;
						}
					}
				});
				
				graph = make_graph(data.querySelector("graph"), keys);	// genero il grafico con relativi attributi
				
				container_width = document.body.offsetWidth - width_delta;
				container_height = document.body.offsetHeight;
				
				//position_graph(graph);	// posiziono i nodi con un certo criterio
				cola_position_graph(graph);
			
			// SVG & defs
			
				var svg = d3.select("body")
				.append("svg")
				  .attr({
					"class": "graph",
					"width": container_width,
					"height": graph_height,
					"viewBox": "0 0 " + (graph_width + Troncola.graph_margin) + " " + (graph_height + Troncola.graph_margin)
				  });
				  
				var defs = svg.append("defs");
				gen_markers(defs, graph);		// genero le punte delle frecce
				
			// Edge	
			
				var edge_groups = svg.selectAll(".edge_group")	// creo un gruppo che conterra tutti gli el. dell' edge
				  .data(graph.edges)
				.enter().append("g")
				  .attr({
					  "class": "edge_group"
				  });
				
				var edges = edge_groups	// creo gli oggetti edge
				.append("line")
				  .attr({
					"class": "edge",
					"x1": function(d) { return d.source.x; },
					"y1": function(d) { return d.source.y; },
					"x2": function(d) { return d.target.x; },
					"y2": function(d) { return d.target.y; },
					"marker-end": function(d) { if (d.arrow === "True") return "url(#arrow-" + d.color.substring(1) + ")"; }
				  })
				  .style({
					"stroke": function(d) { return d.color; },
					"stroke-width": function(d) { if (d.width) return d.width + "px"; else return Troncola.stroke_width + "px"; },
					"stroke-dasharray": function(d) { if (d.line === "Dash") return "5,5"; }
				  });
				
				var edge_label_groups = edge_groups
				.append("g")
				  .attr({
					"class": "edge_label_group"
				  });
				
				var edge_label_bgs = edge_label_groups
				.append("rect")
				  .attr({
					"class": "edge_label_bg"
				  })
				  .style({
					"fill": "#FFFFFF"//, //todo: enable
					//"visibility": function(d) { if (d.label) return "visible"; else return "hidden"; }
				  });
				
				var edge_labels = edge_label_groups
				.append("text")
				  .text(function(d) { if (d.label) return d.label; else return "Edge"; })
				  .attr({
					  "class": "edge_label",
					  "x": function(d) {
								return (d.source.x + d.target.x) / 2;
							},
					  "y": function(d) {
								return (Troncola.font_size + d.source.y + d.target.y) / 2;
							}
				  })
				  .style({
					"fill": function(d) { if (d.fontcolor) return d.fontcolor; else return "#000000"; },
					"text-anchor": "middle",
					"font-size": function(d) { if (d.fontsize) return d.fontsize + "px"; else return Troncola.font_size + "px"; },
					"font-family": Troncola.label_font_name//, //todo: enable
					//"visibility": function(d) { if (d.label) return "visible"; else return "hidden"; }
				  });
				  
				edge_label_bgs.attr({
				  "x": function(d, i) {
							return edge_labels[0][i].getBBox().x - 1;
						},
				  "y": function(d) {
							return (d.source.y + d.target.y - Troncola.font_size) / 2;
						},
				  "width": function(d, i) { 
							return edge_labels[0][i].getBBox().width + 1;
						},
				  "height":function(d, i) { 
							return edge_labels[0][i].getBBox().height + 1;
						}
				  });
				  
				edge_label_groups.on("mouseover", edge_over);
				edge_label_groups.on("mouseout", edge_out);
				
			// Node
				
				var node_groups = svg.selectAll(".node_group")	// creo un gruppo che conterra tutti gli el. del nodo
				  .data(graph.nodes)
				.enter().append("g")
				  .attr({
					  "class": "node_group",
					  "transform": function(d) { return "translate(" + d.x + ", " + d.y + ")"; }
				  });
				
				var nodes = node_groups
				.append("ellipse")
				  .attr({
					"class": "node",
					//note: le frecce sono in posizione giusta sse width === height quindi faccio max
					"rx": function(d) { return Math.max(d.height, d.width) /*d.width*/ * Troncola.scale_factor; },
					"ry": function(d) { return Math.max(d.height, d.width) /*d.height*/ * Troncola.scale_factor; },
					"cx": "0",
					"cy": "0"
				  })
				  .style({
					"fill": function(d) { return d.fillcolor; },
					"stroke": function(d) { return d.bordercolor; },
					"stroke-width": function(d) { return d.borderwidth; }
				  });
				
				var node_labels = node_groups
				.append("text")
				  .text(function(d) { return d.label; })
				  .attr({
					  "class": "node_label",
					  "x": "0",
					  "y": Troncola.font_size / 2
				  })
				  .style({
					"fill": function(d) { return d.fontcolor; },
					"text-anchor": "middle",
					"font-size": Troncola.font_size + "px",
					"font-family": Troncola.label_font_name
				  });
				
				var node_descs = node_groups
				.append("text")
				  .text(function(d) { if (d.name === "OR" || d.name === "XOR") return d.name; else return d.type; })
				  .attr({
					"class": "node_desc",
					"x": "0",
					"y": Troncola.font_size / 2
				  })
				  .style({
					"fill": "#000000",
					"text-anchor": "middle",
					"font-size": "0px",
					"font-family": Troncola.desc_font_name,
					"visibility": "hidden"
				  });
				
				node_groups.on("mouseover", node_over);
				node_groups.on("mouseout", node_out);
			});
		}
	};
	
	// Crea l'oggetto Troncola a livello globale
	if (typeof define === "function" && define.amd)
		this.Troncola = Troncola, define(Troncola);
	else
		if (typeof module === "object" && module.exports) module.exports = Troncola;
	else
		this.Troncola = Troncola;
} ();
