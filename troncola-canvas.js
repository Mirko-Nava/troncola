!function() {

// Variabili Private

	var reference_system = {
		"x" : 0,
		"y" : 0,
		"width" : 0,
		"height" : 0
	};

	var camera = {
		"x" : 0,
		"y" : 0,
		"width" : 0,
		"height" : 0,
	}

	var graph = undefined;				// Oggetto che rappresenta il grafo
	var renderer = undefined;			// Oggetto che permette la stampa su canvas
	var dragging = undefined;			// Id del nodo in fase dragging
	var hovering = undefined;			// Id del nodo in fase hovering
	var font_size = 14;					// Dimensione font in px

	var Troncola = {
		
// Variabili Pubbliche
		
		"size_scale":		0.33,		// Fattore di scala per i nodi
		"stroke_width":		4,			// Spessore linee
		"label_font_name":	"arial",	// Font dei label dei nodi
		"desc_font_name":	"courier",	// Font delle descrizioni dei nodi

// Funzioni

		"draw_graph": function(filename) {
			
		// Eventi

			function wheel(event) {
				console.log("zoom " + event.wheelDelta);
				camera.width += event.deltaX;
				camera.height += event.deltaY;
				draw();
			}

		// Stampa grafico

			function draw() {

				function transform(m) {
					renderer.transform(m.scalex, 0, 0, m.scaley, m.trasx, m.trasy);
				}

				transform({
					"scalex": reference_system.width / camera.width,
					"scaley": reference_system.height / camera.height,
					"trasx": -camera.x,
					"trasy": -camera.y
				});

				graph.edges.forEach(function(e) {
					renderer.beginPath();
					renderer.moveTo(e.source.x, e.source.y);
					renderer.lineTo(e.target.x, e.target.y);
					renderer.lineWidth = 15;
					renderer.strokeStyle = "#FF0000";
					renderer.stroke();
				});

				/*var edges = edge_groups
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

				  edge_groups.on("click", edge_click);

			// Nodes
				
				var node_groups = svg.selectAll(".node_group")
				  .data(graph.nodes)
				.enter().append("g")
				  .attr({
					  "class": "node_group",
					  "transform": function(d) {
					  	return "translate(" + d.x + ", " + d.y + ")"; }
				  })
				  .style("cursor", "grab");
				
				var nodes = node_groups
				.append("ellipse")
				.filter(function(d) { return !IsAnOperator(d.name); })
				  .attr({
					"class": "node",
					"rx": function(d) { return d.width * Troncola.size_scale; },
					"ry": function(d) { return d.height * Troncola.size_scale; },
					"cx": "0",
					"cy": "0"
				  })
				  .style({
					"fill": function(d) { return d.fillcolor; },
					"stroke": function(d) { return d.bordercolor; },
					"stroke-width": function(d) { return d.borderwidth; }
				  });
				
				var node_labels = node_groups//.selectAll(".label_link")
				.append("text")
				  .text(function(d) { return d.label; })
				  .attr({
					  "class": "node_label",
					  "x": "0",
					  "y": font_size / 2
				  })
				  .style({
					"fill": function(d) { return d.fontcolor; },
					"text-anchor": "middle",
					"font-size": font_size + "px",
					"font-family": Troncola.label_font_name
				  });

				node_groups.on("mousedown", node_drag_start);
				node_groups.on("mousemove", node_dragging);
				node_groups.on("mouseup", node_drag_stop);
				node_groups.on("mouseout", node_out);

			// Operators

				var operators = node_groups
				.append("polygon")
				.filter(function(d) { return IsAnOperator(d.name); })
				  .attr({
				  	"class": "operator",
				  	"points": function(d) {
				  				var l = d.width * Troncola.size_scale * 1.5; //todo: almeno è un po piu grosso
				  				return "0," + -l + " " + l + ",0 0," + l + " " + -l + ",0"; // rombo di lato l
				  			}
				  })
				  .style({
				  	"fill": function(d) { return d.fillcolor; },
					"stroke": function(d) { return d.bordercolor; },
					"stroke-width": function(d) { return d.borderwidth; }
				  });

				var operator_symbols = node_groups
				.append("path")
				.filter(function(d) { return IsAnOperator(d.name); })
				  .attr({
				  	"class": "operator_symbol",
				  	"d": function(d) {
				  		var l = "" + (d.width * Troncola.size_scale - 10);

				  		switch (d.name) {
				  			case "OR": return "m "+-l+",0 a "+l+","+l+" 0 1,0 "+2*l+",0 a "+l+","+l+" 0 1,0 "+-2*l+",0";
				  			case "XOR": return "m "+l+","+l+" l "+-2*l+","+-2*l+" m "+2*l+",0 l "+-2*l+","+2*l;
				  			case "AND": return "m 0,"+-l+" l 0,"+2*l+" m "+-l+","+-l+" l "+2*l+",0";
				  		}
				  	}
				  })
				  .style({
				  	"fill": "none",
					"stroke": "#000000",
					"stroke-width": "3"
				  });

			// Side Bar

				var side_bar = d3.select("#side_bar");

				side_bar
				.append("p")
				  .text("Nessun nodo selezionato")
				  .attr("class", "title");

				side_bar
				.append("p")
				  .text("Clicca su un nodo per avere maggiori informazioni")
				  .attr("class", "desc");
*/
			}

		// Generazione grafico
		
			function make_graph(graph_tag, keys) {

				function arrayObjectIndexOf(myArray, property, searchTerm) {	
					for(var i = 0, len = myArray.length; i < len; i++) {
						if (myArray[i][property] === searchTerm) return i;
					}
					return -1;
				}

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
				
				//todo: aggiungere is_op agli oggetti!
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
					n.width *= 1.5;
					n.height *= 1.5;
				})

				d3cola
 				  .nodes(graph.nodes)
				  .links(graph.edges)
				  .flowLayout("y", 100)
				  .symmetricDiffLinkLengths(70)
				  .start(50, 15, 5)
				  .stop();

				graph.nodes.forEach(function (n) {
					n.width /= 1.5;
					n.height /= 1.5;
				});
			}

			function NCBIGeneQueryURL(gene, organism) {
				var url = "http://www.ncbi.nlm.nih.gov/gene/?term=";
				
				if (gene)
				{
					url += gene.split("_")[0] + "[SYM]";	// e.g.: gene "CBL_Ex_8_9" diventa "CBL", JARID_2 rinominato in JARID2
				}
				
				if (organism)
				{
					url += organism + "[ORGN]";
				}

				return url;
			}

			function IsAnOperator(name) {
				return name === "OR" || name === "XOR" || name === "AND";
			}

		// Codice
			
			// Load XML and generate graph object
			
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

				cola_position_graph(graph);		// posiziono i nodi con un certo criterio

				reference_system.width = d3.max(graph.nodes, function(d) { return d.x + d.width * Troncola.size_scale; });
				reference_system.height = d3.max(graph.nodes, function(d) { return d.y + d.height * Troncola.size_scale; });

			// Init canvas

				var canvas = document.getElementById("graph_container");

				canvas.setAttribute("width", reference_system.width);
				canvas.setAttribute("height", reference_system.height);

				renderer = canvas.getContext("2d");

				camera.x = d3.min(graph.nodes, function(n) { return n.x - n.width / 2; });
				camera.y = d3.min(graph.nodes, function(n) { return n.y - n.height / 2; });
				camera.width = canvas.offsetWidth;
				camera.height = canvas.offsetHeight;

				draw();

				canvas.onmouseup = function() {};
				canvas.onmousedown = function() {};
				canvas.onwheel = wheel;
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
