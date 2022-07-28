function aggregatedData(top10Countries) {
	// Calculating rest of the 
	var totalOf10 = 0;
	var totalOf3 = 0;
	var i = 1;
	for (t of top10Countries) {
		totalOf10 = t.percentTotal + totalOf10;
		totalOf3 = totalOf3 + (i < 4 ? t.percentTotal : 0);
		i = i + 1;
	}
	
	var restOfTheWorld = 1 - totalOf10;
	
	return [totalOf3, totalOf10, restOfTheWorld];
}

async function ringChart(year) {
	var pi = Math.PI;
	var formatPercent = d3.format(".0%");
	var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#ccc"]
	var outerCircleColors = ["teal", "red"];
	
	top10Countries = topCountries(fulldata, 2019, Co2Indicator.Total, 10);
	
	var aggData = aggregatedData(top10Countries);
	top10Countries.push({r: 11, c: "Rest of the world", displayName: "none", percentTotal: aggData[2]})
	
	var top3 = [{name: "Top 10 emitters", percentTotal: aggData[1]}, {name: "Top 3 emitters", percentTotal: aggData[0]}]
	
	var numberOfValues = top10Countries.length;
	var arcWidth = 60; // width of each arc in the graph
	var degree = Math.PI / 180; // just to convert the radian-numbers

	// Set name of country in the chart description.
	d3.select("#chart-summary #chart-title").text("Most emisson comes from few countries.")
	document.getElementById("chart-desc").innerHTML = "Top 10 largest CO2 emitters contributed more than 70% to total CO2 emission in the world in 2019. Top 3 of these contributed over 50% over same time."
	
	// Appending SVG to the body
	var svg = d3.select("#ringChart-wrapper")
		.append("svg")
		.attr("width", outerwidth)
		.attr("height", outerheight)
		.attr("id", "ringChart");

	// Container for the arcs
	var curves = svg.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	ringLegend(curves);

	// Appending the curve path endAngle to show percentage of data[top10Data]
	curves.selectAll("path")
		.data(top10Countries)
		.enter().append("path")
		.each(arcFunction);

	//Append the country name and contribution to each slice
	curves.selectAll(".countryText")
		.data(top10Countries)
		.enter().append("text")
		.attr("class", "countryText")
		.attr("x", 5)   //Move the text from the start angle of the arc
		.attr("dy", 20) //Move the text down
		.append("textPath")
		.attr("font-weight", 700)
		.attr("xlink:href",function(d,i){return "#countryArc_"+i;})
		.text(function(d, i){return i < 5 || i == 10 ? `${d.c} ${Math.round(d.percentTotal * 100)}%` : "";});

	// Container for the arcs
	var curves1 = svg.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	// Appending the curve path endAngle to show percentage of data[top10Data]
	curves1.selectAll("path")
		.data(top3)
		.enter().append("path")
		.each(function(d, index) {
			var pathArc = d3.arc()
				.innerRadius(width / 5 + (index + 1) * 25 - 20)
				.outerRadius(width / 5 + (index + 1) * 25);

			  return d3.select(this)
				.style("fill", outerCircleColors[index])
				.attr("id", function(d,i) { return "aggArc_"+ index; })
				.attr("d", pathArc.startAngle(0))
				.attr("d", pathArc.endAngle(top3[index].percentTotal * 360 * degree));
		});
		
	curves1.selectAll(".aggText")
		.data(top3)
		.enter().append("text")
		.attr("class", "aggText")
		.attr("x", 350)   //Move the text from the start angle of the arc
		.attr("dy", 13) //Move the text down
		.append("textPath")
		.attr("font-weight", 700)
		.attr("xlink:href",function(d,i){return "#aggArc_"+i;})
		.text(function(d, i) {return `${d.name} - ${Math.round(d.percentTotal * 100)} %`});

	// Function called for each path appended to increase scale and iterate.
	function arcFunction(d, index) {
		var pathArc = d3.arc()
			.innerRadius(width / 5 - arcWidth)
			.outerRadius(width / 5);

		  return d3.select(this)
			.style("fill", colors[index])
			.attr("id", function(d,i) { return "countryArc_"+index; })
			.attr("d", pathArc.startAngle(startEndAngles(top10Countries, index)[0]))
			.attr("d", pathArc.endAngle(startEndAngles(top10Countries, index)[1]));
	}

	function startEndAngles(countries, index) {
	  var cp = countries.map(c => c.percentTotal);
	  var sa = sumUpto(cp, index) * 360 * degree;
	  var ea = sa + cp[index] * 360 * degree;
	  return [sa, ea]
	}

	function sumUpto(cp, index) {
	  var result = 0;
	  for (let i = 0; i < index; i++) {
		result += cp[i];
	  }
	  return result;
	}
	
	function ringLegend(legendSvg) {
		var xval = 300;
		var yval = -150;
		var r = 10
		var heading = ["71%", "53%"];
		var label3 = ["The 3 largest greenhouse gas emitters contribute", "over half of global emissions."]
		var label10 = ["The 10 largest greenhouse gas emitters contribute", "over two thirds of global emissions."]
		legendSvg.selectAll("ringLegnedCircle")
			.data(heading)
			.enter()
			.append("circle")
			.attr("cx", xval)
			.attr("cy", function(d, i) {return yval + i * 100})
			.attr("r", r)
			.style("fill", function(d, i) {return outerCircleColors[i]});
			
		legendSvg.selectAll("ringLegnedLabel")
		  .data(heading)
		  .enter()
		  .append("text")
			.attr("x", xval + 2 * r)
			.attr("y", function(d, i) { return yval + 5 + i * 100})
			.style("fill", "black")
			.text(function(d, i) {return d;});
			
		legendSvg.selectAll("ringLegnedLabel")
		  .data(label10)
		  .enter()
		  .append("text")
			.attr("x", xval - 10)
			.attr("y", function(d, i) {return yval + 35 + i * 20})
			.style("fill", "black")
			.text(function(d, i) {return d;});
			
		legendSvg.selectAll("ringLegnedLabel")
		  .data(label3)
		  .enter()
		  .append("text")
			.attr("x", xval - 10)
			.attr("y", function(d, i) {return yval + 135 + i * 20})
			.style("fill", "black")
			.text(function(d, i) {return d;});
			
		// 2019 in the center.
		legendSvg.selectAll("ringLegnedLabel")
		  .data(label10)
		  .enter()
		  .append("text")
			.attr("x", -80)
			.attr("y", 20)
			.attr("font-weight", 700)
			.style("fill", "grey")
			.style("font-size", "5em")
			.text(2019);
	}
}