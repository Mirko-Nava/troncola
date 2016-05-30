!function() {

// Variabili Private

	var d3cola = undefined;
	var node_hw = undefined;			// metà altezza massima dei nodi
	var node_hh = undefined;			// metà larghezza massima dei nodi
	var graph_x = undefined;			// x del grafico
	var graph_y = undefined;			// y del grafico
	var graph_width = undefined;		// larghezza del grafico
	var graph_height = undefined;		// altezza del grafico
	var hover_factor = 2;				// fattore di scaling dei nodi on hover
	var dragging = undefined;			// id del nodo in fase dragging
	var hovering = undefined;			// ide del nodo in fase hovering
	var drag_x = 0;						// x del mouse al frame precedente
	var drag_y = 0;						// y del mouse al frame precendete
	var scale_x = 1;
	var scale_y = 1;

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

			function svg_wheel() {
				//console.log("mouse wheel at svg");

				var svg = d3.select(".graph"), delta = d3.event.deltaY / 100;
				scale_x += delta;
				scale_y += delta;
				svg.attr("viewBox", "0 0 " + (graph_width * scale_x) + " " + (graph_height * scale_y));

				//todo: mouvere di delta / 2 il grafo per simulare uno zoom con origine in centro allo schermo
			}

			function svg_drag_start() {
				if (!dragging)
				{
					//console.log("start drag at svg");
					if (d3.event.type === "mousedown") {
						drag_x = d3.event.clientX;
						drag_y = d3.event.clientY;
					}
					dragging = "SVG";
				}
			}

			function svg_dragging() {
				if (dragging === "SVG")
				{
					//console.log("dragging at svg");

					var svg = d3.select(".graph").select("g"), dx = 0, dy = 0;

					if (d3.event.type === "mousemove") {
						dx = d3.event.clientX - drag_x;
						dy = d3.event.clientY - drag_y;
					}

					graph_x -= dx * scale_x;
					graph_y -= dy * scale_y;
					drag_x += dx;
					drag_y += dy;

					svg.attr("transform", "translate(" + 
						(-graph_x + node_hw * hover_factor) + ", " +
						(-graph_y + node_hh * hover_factor) + ")"
				 	  );

					d3.event.preventDefault();
				}
			}

			function svg_drag_stop() {
				if (dragging === "SVG")
				{
					//console.log("stop drag at svg");
					dragging = undefined;
				}
			}

			function svg_out() {
				if (dragging === "SVG") {
					svg_drag_stop.call(this);
				}
			}

			function edge_selected(d) {
				var title = "", desc = "", is_an_op = IsAnOperator(d.name);

				title += "Edge tra " + d.source.name + " e " + d.target.name;
				desc += "descrizione";

				d3.select("#side_bar").select(".title").text(title);
				d3.select("#side_bar").select(".desc").text(desc);
			}

			function edge_click(d) {
				edge_selected(d);
			}

			function node_selected(d) {
				var title = "", desc = "", is_an_op = IsAnOperator(d.name);

				if (is_an_op) {
					title += d.name;

					switch(d.name) {
						case "OR": {
							desc += "La causa è uno o più dei geni entranti";
							break;
						}
						case "XOR": {
							desc += "La causa è uno soltato tra i geni entranti";
							break;
						}
						case "AND": {
							desc += "Le cause sono tutti i geni entranti";
							break;
						}
					}

					d3.select("#side_bar").select(".title").text(title);
					d3.select("#side_bar").select(".desc").text(desc);
				} else {
					title += "<a href=\""+ NCBIGeneQueryURL(d.name, "human") +"\" target=\"_blank\">" + d.name + "</a>";
					desc += "tipo: " + d.type + "\n";

					d3.select("#side_bar").select(".title").html(title);
					d3.select("#side_bar").select(".desc").text(desc);	//todo: use text only if it is plain text
				}

				d3.event.preventDefault();
			}

			function node_drag_start(d) {
				if (!dragging)
				{
					//console.log("start drag at " + d.id);
					if (d3.event.type === "mousedown") {
						drag_x = d3.event.clientX;
						drag_y = d3.event.clientY;
					}

					d3.select(this).style("cursor", "grabbing");
					node_selected(d);
					d3.event.preventDefault();
					dragging = d.id;
				}
			}

			function node_dragging(d) {
				if (dragging === d.id)
				{
					var node = d3.select(this), dx = 0, dy = 0;

					if (d3.event.type === "mousemove") {
						dx = d3.event.clientX - drag_x;
						dy = d3.event.clientY - drag_y;
					}

					d.x += dx * scale_x;
					d.y += dy * scale_y;
					drag_x += dx;
					drag_y += dy;

					//console.log("dragging at " + d.id);
					node.attr("transform", "translate(" + d.x + ", " + d.y + ")");
					
					// update only nodes wich has source or target === this
					d3.selectAll(".edge_group")[0].forEach(function(e) {
						edge = d3.select(e).select(".edge");
						if (edge.datum().source.id === node.datum().id) {
							edge
							  .attr({
								"x1": d.x,
								"y1": d.y
							  });
						}

						if (edge.datum().target.id === node.datum().id) {
							edge
							  .attr({
								"x2": d.x,
								"y2": d.y
							  });
						}
					});

					d3.event.preventDefault();
				}
			}

			function node_drag_stop(d) {
				if (dragging === d.id)
				{
					//console.log("stop drag at " + d.id);
					dragging = undefined;
					d3.select(this).style("cursor", "grab");
					d3.event.preventDefault();
				}
			}

			function node_out(d) {
				if (dragging === d.id) {
					node_drag_stop.call(this, d);
				}
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
				d3cola = cola.d3adaptor()
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
				  .symmetricDiffLinkLengths(node_hw * 1.5)
				  .start(50, 15, 5)
				  .stop();

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
						"refX": 10.5 + node_hh * 4 /  Troncola.stroke_width,
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
						  "stroke-width": "2px"
					  });
				});
			}

			function arrayObjectIndexOf(myArray, property, searchTerm) {	
				for(var i = 0, len = myArray.length; i < len; i++) {
					if (myArray[i][property] === searchTerm) return i;
				}
				return -1;
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
			
		// Code
			
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
				
				node_hw = d3.max(graph.nodes, function(d) { return d.width; }) * Troncola.size_scale * 0.5;
				node_hh = d3.max(graph.nodes, function(d) { return d.height; }) * Troncola.size_scale * 0.5;

				cola_position_graph(graph);		// posiziono i nodi con un certo criterio

				graph_x = d3.min(graph.nodes, function(d) { return d.x - d.width * Troncola.size_scale; });
				graph_y = d3.min(graph.nodes, function(d) { return d.y - d.height * Troncola.size_scale; });
				graph_width = d3.max(graph.nodes, function(d) { return d.x + d.width * Troncola.size_scale; }) - graph_x;
				graph_height = d3.max(graph.nodes, function(d) { return d.y + d.height * Troncola.size_scale; }) - graph_y;

				graph_width += 2 * node_hw * hover_factor;
				graph_height += 2 * node_hh * hover_factor;

			// SVG & Defs
			
				var container =  d3.select("#graph_container");

				container.on("mousedown", svg_drag_start);
				container.on("mousemove", svg_dragging);
				container.on("mouseup", svg_drag_stop);
				container.on("mouseout", svg_out);
				container.on("wheel", svg_wheel);

				var svg = container
				.append("svg")
				  .attr({
					"class": "graph",
					"width": graph_width,
					"height": graph_height,
					"viewBox": "0 0 " + graph_width + " " + graph_height,
					"xmlns": "http://www.w3.org/2000/svg",
					"xmlns:xlink": "http://www.w3.org/1999/xlink",
					"version": "1.1"
				  });

				var defs = svg.append("defs");
				gen_markers(defs, graph);		// genero le punte delle frecce

				svg = svg 
				.append("g")
				  .attr("transform", "translate(" + 
						(-graph_x + node_hw * hover_factor) + ", " +
						(-graph_y + node_hh * hover_factor) + ")"
				  );
				
			// Edges
			
				var edge_groups = svg.selectAll(".edge_group")
				  .data(graph.edges)
				.enter().append("g")
				  .attr({
					  "class": "edge_group"
				  });
				
				var edges = edge_groups
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
				
				/*var node_hrefs = node_groups
				.append("a")
				.filter(function(d) { return !IsAnOperator(d.name); })
				  .attr({
				  	"class": "label_link",
				  	"xlink:title": function(d) { return "NCBI Gene " + d.label; },
				  	"xlink:href": function(d) { return NCBIGeneQueryURL(d.label, "human"); },
				  	"target": "_blank"
				  });
				*/

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
