async function lineChartForCountries(indicator, chart_title, chart_description) {
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
	
	const data2019 = fulldata.filter(o => o.Year == 2019)
	
	const countrySortedByEmission = indicator == Co2Indicator.PerCapita ? 
				data2019.sort((a,b) => b.PerCapitaCo2 - a.PerCapitaCo2).map(a => a.Country) : 
				data2019.sort((a,b) => b.TotalCO2 - a.TotalCO2).map(a => a.Country);
	
	let countryCount = 5;
	
	let top10Countries = [];
	
	for (const rank in countrySortedByEmission) {
		top10Countries.push({r: rank, c: countrySortedByEmission[rank], displayName: `${parseInt(rank) + 1} - ${countrySortedByEmission[rank]}`});
		if (rank == countryCount - 1) {
			break;
		}
	}
	
	let data = fulldata.filter(o => top10Countries.map(k => k.c).includes(o.Country))
	
	const maxVal = indicator == Co2Indicator.PerCapita ? Math.max(...data.map(a => a.PerCapitaCo2)) + 10 : Math.max(...data.map(a => a.TotalCO2)) + 1;
	
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
	// createLineChartToolTip(lineSvg, data, xscale, yscale, 6, 'top', years)
	
	// Grid
	grid = g => createLineChartGrid(g, xscale, yscale)
	
	// Color scale by Income group.
	var countryColors = d3.scaleOrdinal()
		.domain(top10Countries.map(c => c.displayName))
		.range(d3.schemeCategory10);
	
	// Create legend.
	multiCountryLineChartLegend(outerheight, top10Countries.map(c => c.displayName), countryColors);

	// Left line chart
	for (const country of top10Countries) {
		let countryData = data.filter(o => o.Country == country.c)
		lineSvg.append("g") 
			.attr("transform", "translate("+margin+","+margin+")") 
			.append("path").datum(countryData)
			.style("fill", "none")
			.attr("stroke-width", 1.5)
			.attr("stroke", countryColors(country.displayName))
			.attr("d", d3.line()
							.x(function(d) { return xscale(d.Year) })
							.y(function(d) { return yscale(indicator == Co2Indicator.PerCapita ? d.PerCapitaCo2 : d.TotalCO2) })
				);

		// Add points on lines.
		lineSvg.append("g") 
			.attr("transform", "translate("+margin+","+margin+")") 
			.selectAll("circle").data(countryData).enter().append("circle")
			.call(g => g.attr("cx", function(d, i) {return xscale(d.Year)}) 
						.attr("cy", function(d, i) {return yscale(indicator == Co2Indicator.PerCapita ? d.PerCapitaCo2 : d.TotalCO2)})
						.attr("r", "4")
						.style("fill", countryColors(country.displayName)))
			.append("title")
			.text(function(d) {return Top10TooltipText(d)});
			
		// createLineChartToolTip(lineSvg, countryData, xscale, yscale, 6, `${country.c}`, years)
	}
	
	// Recession line.
	lineSvg.append("line") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.attr("class", "dashed")
		.attr("stroke-width", 1.5)
		.attr("stroke", "black")
		.attr("x1", xscale(2009))
		.attr("y1", yscale(0))
		.attr("x2", xscale(2009))
		.attr("y2", yscale(maxVal))
	
	lineSvg.append("text") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.attr("x", xscale(2009 + 0.25))
		.attr("y", yscale(maxVal * 0.8))
		.attr("dy", ".35em")
		.text("Economic recession.")
	
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
}

// Method - Genereate line chart legends
var multiCountryLineChartLegend = function(outerheight, countries, countryColors) {
	var marginLengend = 5
	var legendW = 200
	var legendH = outerheight
	
	var legendSvg = d3.select("#lineChart-legend")
		.append("svg")
		.attr("transform", "translate("+marginLengend+","+marginLengend+")")
		.attr("width", legendW)
		.attr("height", legendH)
		.attr("id", "lineChartlegend");
	
	legendSvg.selectAll("rect")
	  .data(countries)
	  .enter()
	  .append("rect")
		.attr("x", 10)
		.attr("y", function(d,i){ return 107 + i*25})
		.attr("width", 10)
		.attr("height", 10)
		.style("fill", function(d){ return countryColors(d)})

	legendSvg.selectAll("mylabels")
	  .data(countries)
	  .enter()
	  .append("text")
		.attr("x", 30)
		.attr("y", function(d,i){ return 117 + i*25})
		.style("fill", function(d){ return countryColors(d)})
		.text(function(d){ return d; });
}

var top10ToolTipTextArray = function(d, indicator) {
	return [`${d.Country} - ${d.Year}`,
			`Per capita emission (mt): ${d.PerCapitaCo2}`,
			`Toal emission (kt): ${d.TotalCO2}`];
}

// Common tooltip for all charts
var Top10TooltipText = function(d) {
	let txt = '';
	for (const x of top10ToolTipTextArray(d)) {
		txt = txt === '' ?  x : txt + '\n' + x;
	}	

	return txt;
}