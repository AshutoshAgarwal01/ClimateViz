async function lineChart(country) {
	const fulldata = await d3.csv("YearCountryWiseIndicators.csv");
	const margin = 50; 
	
	const outerwidth = 1400; 
	const outerheight = 700; 
	
	const width = outerwidth - 2 * margin; 
	const height = outerheight - 2 * margin; 
	
	var lineSvg = d3.select("#line-chart-wrapper")
	.append("svg")
    .attr("width", outerwidth)
    .attr("height", outerheight)
	.attr("id", "lineChart");
	
	// Set name of country in the chart description.
	d3.select("#line-chart-text #total-emission").text(`Total CO2 emission (kt) for ${country} over the years.`)
	
	let data = fulldata.filter(o => o.Country == country)
	
	const maxCO2 =  Math.max(...data.map(a => a.TotalCO2));
	const maxPerCapitaCO2 =  Math.max(...data.map(a => a.PerCapitaCo2));
	
	// Common methods to format axis.
	formatXAxis = (a) => { return a.tickValues(['1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019']); }
	formatYAxis = (a) => { return a.tickFormat(d3.format("~s")); }

	// Horizontal axis - GDP
	const xscale = d3.scaleLinear().domain([1990, 2019]).range([0, width]); 
	xaxis = g => g
		.call(formatXAxis(d3.axisBottom(xscale)))
		.call(g => g.append("text")
			.attr("x", width)
			.attr("y", margin - 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "end")
			.text("Year"))
			
	// verticle axis - CO2 per capita 
	const yscale = d3.scaleLinear().domain([0, maxCO2 + 1000]).range([height, 0]); 
	yaxis = g => g
		.call(formatYAxis(d3.axisLeft(yscale)))
		.call(g => g.append("text")
			.attr("x", 10)
			.attr("y", margin - 3)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.text("Total CO2 emission(kt)")
			.attr("transform", "rotate(90)"))

	// verticle axis - Total CO2
	const yscale1 = d3.scaleLinear().domain([0, maxPerCapitaCO2 + 1000]).range([height, 0]); 
	yaxis1 = g => g
		.call(formatYAxis(d3.axisLeft(yscale1)))
		.call(g => g.append("text")
			.attr("x", 10)
			.attr("y", margin - 3)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.text("Per capita CO2 emission(mt)")
			.attr("transform", "rotate(90)"))

	// Grid
	grid = g => g
		.attr("stroke", "currentColor")
		.attr("stroke-opacity", 0.1)
		.call(g => g.append("g")
		  .selectAll("line")
		  .data(xscale.ticks())
		  .join("line")
			.attr("x1", d => margin + xscale(d))
			.attr("x2", d => margin + xscale(d))
			.attr("y1", margin)
			.attr("y2", height + margin))
		.call(g => g.append("g")
		  .selectAll("line")
		  .data(yscale.ticks())
		  .join("line")
			.attr("y1", d => yscale(d) + margin)
			.attr("y2", d => yscale(d) + margin)
			.attr("x1", margin)
			.attr("x2", width + margin)); 
	
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.append("path").datum(data)
		// .selectAll("path").data(data).enter().append("path")
		.style("fill", "none")
		.attr("stroke-width", 1.5)
		.attr("stroke", "steelblue")
		.attr("d", d3.line()
						.x(function(d) { return xscale(d.Year) })
						.y(function(d) { return yscale(d.TotalCO2) })
			);
	
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.selectAll("circle").data(data).enter().append("circle")
		.call(g => g.attr("cx", function(d, i) {return xscale(d.Year)}) 
					.attr("cy", function(d, i) {return yscale(d.TotalCO2)})
					.attr("r", "4"))
		.append("title")
		.text(function(d) {return TooltipText(d)});

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
	
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.call(yaxis) 	

	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.call(yaxis1) 

	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+(height+margin)+")")
		.call(xaxis) 
		
	lineSvg.append("g") 
		.call(grid)
}