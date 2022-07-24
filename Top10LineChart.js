async function lineChartForCountries(countries, indicator, chart_title, chart_description) {
	const rightAxisXPos = width + margin;
	
	const axisKeys = {x:{col: "black", indicator: "Year"}, y:[{col: getCo2indicatorColorMap(indicator), indicator: indicator}]}
	
	var lineSvg = d3.select("#line-chart-wrapper")
	.append("svg")
    .attr("width", outerwidth)
    .attr("height", outerheight)
	.attr("id", "lineChart");
	
	// Set chart title and description.
	d3.select("#chart-summary #chart-title").text(chart_title);
	d3.select("#chart-summary p").text(chart_description);
	
	let data = fulldata.filter(o => countries.includes(o.Country))
	
	const maxVal = indicator == Co2Indicator.PerCapita ? Math.max(...data.map(a => a.PerCapitaCo2)) + 1000 : Math.max(...data.map(a => a.TotalCO2)) + 1;
	
	// Common methods to format axis.
	formatXAxis = (a) => { return a.tickValues(years).tickFormat(d3.format("d")); }
	formatYAxis = (a) => { return a.tickFormat(d3.format("~s")); }

	// Horizontal axis - Year
	const xscale = d3.scaleLinear().domain([1990, 2019]).range([0, width]); 
	xaxis = g => g
		.call(formatXAxis(d3.axisBottom(xscale)))
		.call(g => g.append("text")
			.attr("x", width / 2)
			.attr("y", margin - 10)
			.attr("fill", "black") // Explore: we should be able to remove this line.
			.attr("class", "chart-axis")
			.text("Year"));
			
	// verticle axis - Display indicator value.
	const yscale = d3.scaleLinear().domain([0, maxVal]).range([height, 0]); 
	yaxis = g => g
		.call(formatYAxis(d3.axisLeft(yscale)))
		.call(g => g.append("text")
			.attr("x", height/ 2)
			.attr("y", margin - 3)
			.attr("fill", getCo2indicatorColorMap(indicator))
			.attr("class", "chart-axis")
			.text(getCo2IndicatorNames(indicator))
			.attr("transform", "rotate(90)"));

	// Tooltip
	createLineChartToolTip(lineSvg, data, xscale, yscale, 6, 'top', years)
	
	// Grid
	grid = g => createLineChartGrid(g, xscale, yscale)
	
	// Create legend.
	lineChartLegend(outerheight, axisKeys);
	
	// Create annotationData
	const annotationInfo = [{y:2009, l:'Economic recession'}];
	const annotationData = lineChartAnnotation(data, annotationInfo, indicator, xscale, margin, yscale, width, height);
	const makeAnnotations = d3.annotation().annotations(annotationData)
	
	// Left line chart
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.append("path").datum(data)
		.style("fill", "none")
		.attr("stroke-width", 1.5)
		.attr("stroke", "steelblue")
		.attr("d", d3.line()
						.x(function(d) { return xscale(d.Year) })
						.y(function(d) { return yscale(indicator == Co2Indicator.PerCapita ? d.PerCapitaCo2 : d.TotalCO2) })
			);

	// Add points on lines.
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.selectAll("circle").data(data).enter().append("circle")
		.call(g => g.attr("cx", function(d, i) {return xscale(d.Year)}) 
					.attr("cy", function(d, i) {return yscale(indicator == Co2Indicator.PerCapita ? d.PerCapitaCo2 : d.TotalCO2)})
					.attr("r", "4"))
		.append("title")
		.text(function(d) {return TooltipText(d)});
	
	// Add styling and events to the points.
	lineSvg.selectAll("circle")
		.call(g => g.style("stroke", "steelblue")
					.attr("fill-opacity", .2))
		.on('mouseover',function() {
			d3.select(this)
			.attr('stroke-width',4)})
		.on('mouseout',function () {
			d3.select(this)
			.transition()
			.duration(1000)
			.attr('stroke-width',1)});
	
	// add axis
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.call(yaxis) 	

	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+(height+margin)+")")
		.call(xaxis) 
		
	lineSvg.append("g") 
		.call(grid)
		
	lineSvg
		.append("g")
		.call(makeAnnotations);
}