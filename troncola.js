!function() {

// Variabili Private

	var node_hw = undefined;			// metà altezza massima dei nodi
	var node_hh = undefined;			// metà larghezza massima dei nodi
	var graph_x = undefined;			// x del grafico
	var graph_y = undefined;			// y del grafico
	var graph_width = undefined;		// larghezza del grafico
	var graph_height = undefined;		// altezza del grafico
	var hover_factor = 2;				// fattore di scaling dei nodi on hover

	var Troncola = {
		
// Variabili Pubbliche
		
		"scale_factor":		0.33,		// Fattore di scala per i nodi
		"stroke_width":		2,			// Spessore linee
		"font_size":		14,			// Dimensione font in px
		"label_font_name":	"arial",	// Font dei label dei nodi
		"desc_font_name":	"courier",	// Font delle descrizioni dei nodi

// Funzioni

		"draw_graph": function(filename) {
			
		// Eventi
		
			function show_contextmenu(d, i) {
				var context_menu = d3.select("#context_menu");
				var mouse_pos = d3.mouse(document.body);

				context_menu
				  .attr({
					"width": "auto",
					"height": "auto"
				  })
				  .style({
				  	"left": mouse_pos[0] + "px",
				  	"top": mouse_pos[1] + "px",
				  	"visibility": "visible"
				  });

				context_menu.select("a")
				  .text("Goto NCBI Gene " + d.name)
				  .attr("href", NCBIGeneQueryURL(d.name, "human"))
				  .style("visibility", "visible");

				context_menu.select("p")
				  .style("visibility", "visible");

				d3.event.preventDefault();
				d3.event.stopPropagation();
				return false;
			}

			function hide_contextmenu(d, i) {
				var context_menu = d3.select("#context_menu")
				  .attr({
					"width": "0px",
					"height": "0px" 
				  })
				  .style("visibility", "hidden");

				context_menu.select("a")
				  .style("visibility", "hidden");

				context_menu.select("p")
				  .style("visibility", "hidden");
			}

			function node_over(d, i) {
				d3.select(this).select(".node_label")
				.transition()
				  .attr("y", Troncola.font_size / 2 - graph.nodes[i].height / 2);
				  
				d3.select(this).select(".node_desc")
				  .style("visibility", "visible")
				.transition()
				  .style("font-size", Troncola.font_size + "px");
				  
				d3.select(this).select(".node").transition()
				  .attr({
					"rx": d.width * Troncola.scale_factor * hover_factor,
					"ry": d.height * Troncola.scale_factor * hover_factor
				  });
			}

			function node_out(d, i) {
				d3.select(this).select(".node_label")
				.transition()
				  .attr("y", Troncola.font_size / 2);
				  
				d3.select(this).select(".node_desc")
				.transition()
				  .style("font-size", "0px")
				  .each("end", function() {
					  d3.select(this).style({
						"visibility": "hidden"
					  });
				  });
				  
				d3.select(this).select(".node").transition()
				  .attr({
					"rx": d.width * Troncola.scale_factor,
					"ry": d.height * Troncola.scale_factor
				  });
			}
			
			function edge_over(d, i) {
				d3.select(this).select(".edge_label_bg")
				.transition()
				  .style("fill", "#FFFF00");
			}
			
			function edge_out(d, i) {
				d3.select(this).select(".edge_label_bg")
				.transition()
				  .style("fill", "#FFFFFF");
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
			
			function cola_position_graph(graph) {
				var d3cola = cola.d3adaptor()
				  .avoidOverlaps(true)
				  .size([document.body.offsetWidth, document.body.offsetHeight]);

				graph.nodes.forEach(function (n) {
					n.width *= hover_factor * 0.66;
					n.height *= hover_factor * 0.66;
				})

				d3cola
 				  .nodes(graph.nodes)
				  .links(graph.edges)
				  .flowLayout("y", node_hh * 2.5)
				  //.linkDistance(node_hh)
				  .symmetricDiffLinkLengths(node_hw * 1.5)
				  .start(50, 15, 5);
				
				//d3cola.on("tick", function() {} );

				graph.nodes.forEach(function (n) {
					n.width /= hover_factor * 0.66;
					n.height /= hover_factor * 0.66;
				});
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

				colors.forEach(function(color) {	// creo freccia per ogni colore
					defs.append("marker")
					  .attr({
						"id": "arrow-" + color.substring(1),
						"viewBox": "0 -7 10 14",
						"refX": 11 + node_hh * 4 / Troncola.stroke_width,
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

			function NCBIGeneQueryURL(gene, organism) {
				gene = gene.split("_")[0];	// e.g.: gene "CBL_Ex_8_9" diventa "CBL", JARID_2 rinominato in JARID2
				return "http://www.ncbi.nlm.nih.gov/gene/?term=" +  gene + "[sym]" + organism + "[ORGN]";
			}
			
		// Codice
			
			d3.xml(filename, function(error, data) {
				if (error || data === null) {
					alert("Errore durante il caricamento del file \"" + filename + "\"");
					return;
				}
				
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
				
				node_hw = d3.max(graph.nodes, function(d) { return d.width; }) * Troncola.scale_factor * 0.5;
				node_hh = d3.max(graph.nodes, function(d) { return d.height; }) * Troncola.scale_factor * 0.5;

				cola_position_graph(graph);		// posiziono i nodi con un certo criterio

				graph_x = d3.min(graph.nodes, function(d) { return d.x - d.width * Troncola.scale_factor; });
				graph_y = d3.min(graph.nodes, function(d) { return d.y - d.height * Troncola.scale_factor; });
				graph_width = d3.max(graph.nodes, function(d) { return d.x + d.width * Troncola.scale_factor; }) - graph_x;
				graph_height = d3.max(graph.nodes, function(d) { return d.y + d.height * Troncola.scale_factor; }) - graph_y;

			// SVG & defs
			
				var svg = d3.select("body")
				.append("svg")
				  .attr({
					"class": "graph",
					"width": graph_width + 2 * (node_hw * hover_factor),
					"height": graph_height + 2 * (node_hh * hover_factor),
					"xmlns": "http://www.w3.org/2000/svg",
					"xmlns:xlink": "http://www.w3.org/1999/xlink",
					"version": "1.1"
				  });
				  
				var defs = svg.append("defs");
				gen_markers(defs, graph);		// genero le punte delle frecce

				svg = svg 
				.append("g")
				  .attr({
					"transform": "translate(" + 
						(-graph_x + node_hw * hover_factor) + ", " +
						(-graph_y + node_hh * hover_factor) + ")"
				  });
				
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
					"marker-end": function(d) {
									if (d.arrow === "True") return "url(#arrow-" + d.color.substring(1) + ")"; 
								}
				  })
				  .style({
					"stroke": function(d) { return d.color; },
					"stroke-width": function(d) {
										if (d.width) return d.width + "px"; else return Troncola.stroke_width + "px";
									},
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
					"fill": function(d) { if (d.fontcolor) return d.fontcolor; else return d.color; },
					"text-anchor": "middle",
					"font-size": function(d) {
									if (d.fontsize) return d.fontsize + "px"; else return Troncola.font_size + "px";
								},
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
				  
				edge_groups.on("mouseover", edge_over);
				edge_groups.on("mouseout", edge_out);
				
			// Node
				
				var node_groups = svg.selectAll(".node_group")	// creo un gruppo che conterra tutti gli el. del nodo
				  .data(graph.nodes)
				.enter().append("g")
				  .attr({
					  "class": "node_group",
					  "transform": function(d) { return "translate(" + d.x + ", " + d.y + ")"; }
				  });
				  //.call(cola.drag);	//user draw_graph
				
				var nodes = node_groups
				.append("ellipse")
				  .attr({
					"class": "node",
					"rx": function(d) { return d.width * Troncola.scale_factor; },
					"ry": function(d) { return d.height * Troncola.scale_factor; },
					"cx": "0",
					"cy": "0"
				  })
				  .style({
					"fill": function(d) { return d.fillcolor; },
					"stroke": function(d) { return d.bordercolor; },
					"stroke-width": function(d) { return d.borderwidth; }
				  });
				
				var node_labels = node_groups
				.append("a")
				  .attr({	//here
				  	"class": "label_link",
				  	"xlink:title": function(d){ return "NCBI Gene " + d.label; },
				  	"xlink:href": function(d){ return NCBIGeneQueryURL(d.label, "human"); },
				  	"target": "_blank"
				  });

				node_groups.selectAll(".label_link")
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
				  .text(function(d) {
							if (d.name === "OR" || d.name === "XOR") return d.name; else return d.type;
						})
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

			// Context menu

				//document.event.contextmenu.enabled = true;

				d3.select("body")
				.append("div")
				  .attr({
				  	"id": "context_menu",
				  	"width": "0px",
				  	"height": "0px"
				  })
				  .style({
				  	"position": "absolute",
				  	"left": "0",
				  	"top": "0",
				  	"padding": "3px",
				  	"background-color": "#DDDDDD",
				  	"border": "1px outset #000000",
				  	"visibility": "hidden"
				  });

				var context_menu = d3.select("#context_menu");

				context_menu
				.append("a")
				  .attr({
				  	"href": "url",
				  	"target": "_blank"
				  })
				  .style({
				  	"color": "#000000",
				  	"text-align": "center",
				  	"text-decoration": "none",
				  	"margin": "0px",
				  	"visibility": "hidden"
				  })
				  .text("")
				  .on("click", hide_contextmenu);

				context_menu
				.append("p")
				  .style({
				  	"text-align": "center",
				  	"margin": "0px",
				  	"margin-top": "3px",
				  	"border": "3px outset #000000",
				  	"visibility": "hidden"
				  })
				  .text("Cancel")
				  .on("click", hide_contextmenu);


				node_groups.on("mouseover", node_over);
				node_groups.on("mouseout", node_out);
				node_groups.on("contextmenu", show_contextmenu);
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
