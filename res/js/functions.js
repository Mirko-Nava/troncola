!function() {

// Variabili Private

	var graph_width = undefined;		// larghezza teorica del grafico
	var graph_height = undefined;		// altezza teorica del grafico
	var width_delta = 17;				// differenza tra la larghezza teorica del grafico e quella effettiva

// Variabili Pubbliche	

	var Stage = {
		"graph_margin":		0,			// Pixel di margine ai lati
		"scale_factor":		0.33,		// Fattore di scala per i nodi
		"stroke_width":		2,			// Spessore linee
		"font_size":		14,			// Dimensione font in px
		"label_font_name":	"arial",	// Font dei label dei nodi
		"desc_font_name":	"courier",	// Font delle descrizioni dei nodi

// Funzioni

		"draw_graph": function(filename) {
			
			function node_over(d, i) {
				
				//alert(graph.nodes[i].height);
				
				d3.select(this).select(".node_label").transition()
				  .attr({
					"y": Stage.font_size / 2 - graph.nodes[i].height / 2
				  });
				  
				d3.select(this).select(".node_desc")
				  .style({
					"visibility": "visible"
				  })
				  .transition()
				  .style({
					  "font-size": Stage.font_size + "px"
				  });
				  
				d3.select(this).select(".node").transition()
				  .attr({
					"rx": d.width * Stage.scale_factor * 2,
					"ry": d.width * Stage.scale_factor * 2
				  });
			}

			function node_out(d, i) {
				d3.select(this).select(".node_label").transition()
				  .attr({
					"y": Stage.font_size / 2
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
					"rx": d.width * Stage.scale_factor,
					"ry": d.width * Stage.scale_factor
				  });
			}

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
					"marginx": Stage.graph_margin,
					"marginy": Stage.graph_margin
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
						"refX": 10 + max_size * Stage.scale_factor,
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
						  "stroke-width": Stage.stroke_width + "px"
					  });
				});
			}

			function arrayObjectIndexOf(myArray, property, searchTerm) {	// ritorna l'indice dell'elemento che ha la proprietà === valore
				for(var i = 0, len = myArray.length; i < len; i++) {
					if (myArray[i][property] === searchTerm) return i;
				}
				return -1;
			}
			
			d3.xml(filename, function(error, data) {
				if (error)
					throw error;
				
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
				
				position_graph(graph);	// posiziono i nodi con un certo criterio
			
				var container_width = document.body.offsetWidth - width_delta;
				var container_height = document.body.offsetHeight;
			
				var svg = d3.select("body")
				.append("svg")
				  .attr({
					"class": "graph",
					"width": container_width, //container_width		graph_width
					"height": graph_height, //container_height	graph_height
					"viewBox": "0 0 " + (graph_width + Stage.graph_margin) + " " + (graph_height + Stage.graph_margin)
				  });
				  
				var defs = svg.append("defs");
				gen_markers(defs, graph);		// genero le punte delle frecce
				
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
					"x1": function(d) { return graph.nodes[d.source].x; },
					"y1": function(d) { return graph.nodes[d.source].y; },
					"x2": function(d) { return graph.nodes[d.target].x; },
					"y2": function(d) { return graph.nodes[d.target].y; },
					"marker-end": function(d) { if (d.arrow === "True") return "url(#arrow-" + d.color.substring(1) + ")"; }
				  })
				  .style({
					"stroke": function(d) { return d.color; },
					"stroke-width": Stage.stroke_width + "px",
					"stroke-dasharray": function(d) { if (d.line === "Dash") return "5,5"; }
				  });
				  
				var edge_labels = edge_groups
				.append("text")
				  .text(function(d) { if (d.label) return d.label; else return "Edge"; })
				  .attr({
					  "class": "edge_label",
					  "x": function(d) {
								return (graph.nodes[d.source].x + graph.nodes[d.target].x) / 2;
							},
					  "y": function(d) {
								return (Stage.font_size + graph.nodes[d.source].y + graph.nodes[d.target].y) / 2;
							}
				  })
				  .style({
					"fill": function(d) { if (d.fontcolor) return d.fontcolor; else return "#000000"; },
					"text-anchor": "middle",
					"font-size": Stage.font_size + "px",
					"font-family": Stage.label_font_name//,
					//"visibility": function(d) { if (d.label) return "visible"; else return "hidden"; }
				  });
				
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
					"rx": function(d) { return Math.max(d.height, d.width) /*d.width*/ * Stage.scale_factor; },
					"ry": function(d) { return Math.max(d.height, d.width) /*d.height*/ * Stage.scale_factor; },
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
					  "y": Stage.font_size / 2
				  })
				  .style({
					"fill": function(d) { return d.fontcolor; },
					"text-anchor": "middle",
					"font-size": Stage.font_size + "px",
					"font-family": Stage.label_font_name
				  });
				
				var node_descs = node_groups
				.append("text")
				  .text(function(d) { if (d.name === "OR" || d.name === "XOR") return d.name; else return d.type; })
				  .attr({
					"class": "node_desc",
					"x": "0",
					"y": Stage.font_size / 2
				  })
				  .style({
					"fill": "#000000",
					"text-anchor": "middle",
					"font-size": "0px",
					"font-family": Stage.desc_font_name,
					"visibility": "hidden"
				  });
				
				node_groups.on("mouseover", node_over);
				node_groups.on("mouseout", node_out);
			});
		}
	};
	
	// Crea l'oggetto Stage a livello globale
	if (typeof define === "function" && define.amd)
		this.Stage = Stage, define(Stage);
	else
		if (typeof module === "object" && module.exports) module.exports = Stage;
	else
		this.Stage = Stage;
} ();
