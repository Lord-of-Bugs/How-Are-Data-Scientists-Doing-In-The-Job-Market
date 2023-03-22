function plotAll() {
    var filepath = "data/cleaned_data.csv";
    plotCardOne(filepath);
    plotCardTwo(filepath);
    plotCardThree(filepath);
    plotCardFour(filepath);
    plotCardFive(filepath);
    plotCardSix(filepath);
}

function plotCardOne(filepath) {
    d3.csv(filepath).then(data => {
        var currColor = "Avg Salary(K)";
        let salaries = data.map(d => parseFloat(d[currColor]));
        let companyRatings = data.map(d => parseFloat(d['Rating']));

        let width = 675;
        let height = 800;
        let svg = d3.select('#vis1').select('svg');
        svg.attr('width', width).attr('height', height);

        let margin = 30;
        let xScale = d3.scaleLinear().domain([d3.min(salaries) - 5, d3.max(salaries) + 5]).range([margin, width - margin]);
        let yScale = d3.scaleLinear().domain([d3.min(companyRatings) - 0.5, d3.max(companyRatings) + 0.5]).range([height - margin, margin]);
        let colorScale = d3.scaleOrdinal().domain(['Lower Salary', 'Avg Salary(K)', 'Upper Salary']).range(['#9ae17b', '#4fb783', '#307470']);
        let linearRegression = d3.regressionLinear().x(d => parseFloat(d[currColor])).y(d => parseFloat(d['Rating'])).domain([d3.min(salaries) - 5, d3.max(salaries) + 5]);

        svg.append('g').attr('class', 'xaxis').attr("transform", `translate(0, ${height - margin})`).call(d3.axisBottom(xScale));
        svg.append('g').attr('class', 'yaxis').attr("transform", `translate(${margin}, 0)`).call(d3.axisLeft(yScale));

        svg.selectAll('circle').data(data).enter().append('circle')
            .attr('cx', d => xScale(parseFloat(d[currColor])))
            .attr('cy', d => yScale(parseFloat(d['Rating'])))
            .attr('r', 3)
            .attr('stroke', 'black')
            .style('fill', d => colorScale(currColor));

        svg.append('line').attr('class', 'regression').datum(linearRegression(data))
            .attr("x1", d => xScale(d[0][0]))
            .attr("x2", d => xScale(d[1][0]))
            .attr("y1", d => yScale(d[0][1]))
            .attr("y2", d => yScale(d[1][1]))
            .attr('stroke', 'red')
            .attr('stroke-width', 2.5);

        d3.select('.button').on('change', d => {
            currColor = d.target.value;
            
            salaries = data.map(d => parseFloat(d[currColor]));
            let xScale = d3.scaleLinear().domain([d3.min(salaries) - 5, d3.max(salaries) + 5]).range([margin, width - margin]);
            linearRegression = d3.regressionLinear().x(d => parseFloat(d[currColor])).y(d => parseFloat(d['Rating'])).domain([d3.min(salaries) - 5, d3.max(salaries) + 5]);
            svg.selectAll('.xaxis').transition(500).call(d3.axisBottom(xScale));

            svg.selectAll('circle')
                .attr('cx', d => xScale(parseFloat(d[currColor])))
                .attr('cy', d => yScale(parseFloat(d['Rating'])))
                .attr('r', 3)
                .style('fill', d => colorScale(currColor));
            
            svg.selectAll('.regression').remove();
            svg.append('line').attr('class', 'regression').datum(linearRegression(data))
                .attr("x1", d => xScale(d[0][0]))
                .attr("x2", d => xScale(d[1][0]))
                .attr("y1", d => yScale(d[0][1]))
                .attr("y2", d => yScale(d[1][1]))
                .attr('stroke', 'red')
                .attr('stroke-width', 2.5);
            svg.selectAll('.regression').transition(500);
        })

        svg.append('text').attr('x', width - 2.25 * margin).attr('y', height - margin + 25).text('Salary(K)').attr('font-size', 15);
        svg.append('text').attr('x', margin - 5).attr('y', margin - 5).text('Star Rating').attr('font-size', 15);
    });
}

function plotCardTwo(filepath) {
    d3.csv(filepath).then(data => {
        let jobCounts = d3.flatRollup(data, v => v.length, d => d.Industry);
        let popularIndustry = new Set();
        jobCounts.forEach(d => {if(d[1] >= 20) popularIndustry.add(d[0])});
        let popularJobsFromPopularIndustry = data.filter(d => popularIndustry.has(d.Industry));
        let perIndustryAvgPay = d3.flatRollup(popularJobsFromPopularIndustry, v => d3.mean(v, d => parseFloat(d["Avg Salary(K)"])), d => d['Industry']).sort((a, b) => a[0].localeCompare(b[0]));

        var svgheight = 800;
		var svgwidth = 675;
		var marginLeft = 50;
        var buffer = 45;

        var svg = d3.select('#vis2').select('svg')
				    .attr("height", svgheight)
				    .attr("width", svgwidth);

        var xScale = d3.scaleBand()
                .domain(Array.from(perIndustryAvgPay, d => d[0].split('&')[0]))
                .range([buffer, svgwidth-buffer])
                .paddingInner(0.25)
                .paddingOuter(0.15);

        var yScale = d3.scaleLinear()
                .domain([0, d3.max(perIndustryAvgPay, d => d[1]) + 10])
                .range([svgheight - buffer, 0]);

        var colorScale = d3.scaleSequential(d3.interpolateGreens).domain([d3.min(perIndustryAvgPay, d => d[1]) - 20, d3.max(perIndustryAvgPay, d => d[1])]);
                
        svg.append("g").attr("transform", `translate(${marginLeft - buffer}, ${svgheight - buffer + 5})`).call(d3.axisBottom(xScale)).selectAll("text").style("text-anchor", "end").style('font-size', 10).attr("transform", "rotate(-9)");;
        svg.append("g").attr("transform", "translate(" + `${marginLeft}, 5)`).call(d3.axisLeft(yScale));
        let line = svg.append('line').attr('stroke', '#f70776').attr('stroke-width', 2).style('opacity', 0);
        let comment = svg.append('text').attr('opacity', 0).attr('id', 'summary');

        let bars = svg.selectAll('rect').data(perIndustryAvgPay).enter().append('rect').attr('class', 'bar');
        bars.attr("x", (d) => xScale(d[0].split('&')[0]))
            .attr("y", (d) => yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => svgheight - yScale(d[1]) - buffer + 5)
            .style('fill', d => colorScale(d[1]))
            .on('mouseover', (e, d) => {
                let currBar = d3.select(e.target);
                d3.selectAll('.bar').style('opacity', 0.3);
                currBar.style('opacity', 1);
                let currBarHeight = d[1];
                line.style('opacity', 1)
                    .attr('x1', buffer)
                    .attr('x2', svgwidth - buffer)
                    .attr('y1', yScale(currBarHeight))
                    .attr('y2', yScale(currBarHeight));
                comment.attr('x', svgwidth - buffer * 6)
                        .attr('y', buffer * 1.2)
                        .attr('font-weight', 'bold')
                        .text('Annual average salary: $' + Math.round(currBarHeight * 100) / 100 +'K')
                        .style('opacity', 1);
            })
            .on('mouseout', () => {
                d3.selectAll('.bar').transition('saturate').duration(25).style('opacity', 1);
                line.transition('hide').duration(25).style('opacity', 0)
                comment.transition('hidetext').duration(25).style('opacity', 0);
            });
        
        d3.select('#vis2')
            .on('mouseenter', () => {
                
                svg.selectAll('rect')
                    .attr("x", (d) => xScale(d[0].split('&')[0]))
                    .attr("y", (d) => yScale(0))
                    .attr("width", xScale.bandwidth())
                    .attr("height", (d) => svgheight - yScale(0) - buffer)
                    .style('fill', d => colorScale(d[1]));

                svg.selectAll("rect")
                    .transition('rising')
                    .duration(500)
                    .attr("y", d => yScale(d[1]))
                    .attr("height", d => svgheight - yScale(d[1]) - buffer + 5)
                    .delay((d,i) => i*100);

            })
            .on('mouseleave', () => {
                d3.selectAll('.bar').transition('focus').duration(1000).style('opacity', 1);
                line.transition('not-show-line').duration(1000).style('opacity', 0)
                comment.transition('not-show-comment').duration(1000).style('opacity', 0);
            });

        svg.append('text').text('Top Hiring Industries And Annual Average Salaries')
            .attr('x', svgwidth / 7)
            .attr('y', buffer / 2)
            .attr('font-weight', 'bold')
            .attr('font-size', 23);
    })

}

function plotCardThree(filepath) {
    d3.csv(filepath).then(data => {
        let jobCounts = d3.flatRollup(data, v => v.length, d => d.Industry);
        let popularIndustry = new Set();
        jobCounts.forEach(d => {if(d[1] >= 20) popularIndustry.add(d[0])});
        let popularJobsFromPopularIndustry = data.filter(d => popularIndustry.has(d.Industry));
        let grouped = Object.fromEntries(d3.rollup(popularJobsFromPopularIndustry, v => v.length, d => d['Industry'], d => d['job_title_sim']));
        let uniqueJobs = new Set(popularJobsFromPopularIndustry.map(d => d['job_title_sim']));
        uniqueJobs = Array.from(uniqueJobs).sort();
        popularIndustry = Array.from(popularIndustry).sort();
        let unifiedData = [];
        popularIndustry.forEach(d => unifiedData.push({
            'Industry': d,
            'data scientist project manager': grouped[d].has('Data scientist project manager')? grouped[d].get('Data scientist project manager') : 0,
            'analyst': grouped[d].has('analyst')? grouped[d].get('analyst') : 0,
            'data analytics': grouped[d].has('data analitics')? grouped[d].get('data analitics') : 0,
            'data engineer': grouped[d].has('data engineer')? grouped[d].get('data engineer') : 0,
            'data modeler': grouped[d].has('data modeler')? grouped[d].get('data modeler') : 0,
            'data scientist': grouped[d].has('data scientist')? grouped[d].get('data scientist') : 0,
            'director': grouped[d].has('director')? grouped[d].get('director') : 0,
            'machine learning engineer': grouped[d].has('machine learning engineer')? grouped[d].get('machine learning engineer') : 0,
            'other scientist': grouped[d].has('other scientist')? grouped[d].get('other scientist') : 0,
        }));
        
        let width = 685;
        let height = 600;
        let margin = 55;
        let keys = ['data scientist project manager', 'analyst', 'data analytics', 'data engineer', 'data modeler', 'data scientist', 'director', 'machine learning engineer', 'other scientist'];
        var xScale = d3.scaleBand().domain(popularIndustry).range([margin / 2, width-margin/2]);
        var yScale = d3.scaleLinear().domain([0, d3.max(unifiedData, d => d['data scientist project manager'] + d['analyst'] + d['data analytics'] + d['data engineer'] + d['data modeler'] + d['data scientist'] + d['director'] + d['machine learning engineer'] + d['other scientist']) + 10]).range([height-margin, margin]);
        var colorScale = d3.scaleOrdinal().domain(keys).range(['#7dd87d', '#93a7d1', '#fa7f7f', '#eda1c1', '#afc5ff', '#efd510', '#5be7a9', '#ffbd67', '#8293ff']);

        let svg = d3.select("#vis3").select("svg").attr("height", height).attr("width", width);
        svg.append("g").attr("transform", "translate(0," + `${height - margin}` + ")").call(d3.axisBottom(xScale)).selectAll("text").style("text-anchor", "start").attr("transform", "rotate(7.5)");
        svg.append("g").attr("transform", "translate(" + margin/2 + ", 0)").call(d3.axisLeft(yScale));
        let colorLegend = svg.append("g");
                        
        var stacked = d3.stack().keys(keys)(unifiedData);
        let paths = svg.selectAll(".paths").data(stacked).enter().append("path");
        let comment = svg.append("text").attr('id', 'navbar').style("opacity", 0).style("font-size", 15);
        paths.attr("class", "myArea")
            .attr("d", d3.area().x(
                    d => xScale(d.data.Industry) + xScale.bandwidth() / 2
                ).y0(
                    d => yScale(d[0])
                ).y1(
                    d => yScale(d[1])
                )
            )
            .style("fill", (d) => colorScale(d.key))
            .on("mouseover", (e, d) => {
                comment.style('opacity', 1);
                d3.selectAll('.myArea').style('opacity', 0.2);
                let currPath = d3.select(e.target);
                currPath.attr('stroke', 'black').style('opacity', 1);
            })
            .on("mousemove", (e, d) => {
                let mouseLoc = d3.pointer(e);
                comment.text(d.key).attr('x', mouseLoc[0] - 50).attr('y', mouseLoc[1] - 10)
            })
            .on('mouseleave', () => {
                d3.selectAll('.myArea').attr('stroke', 'none').style('opacity', 1);
                comment.style('opacity', 0);
            })
        
        const legend = d3.legendColor().scale(colorScale);
        colorLegend.attr("transform", `translate(${width - margin * 5 + 10}, ${margin * 1.5})`).call(legend);
        svg.append('text').attr('x', margin / 3).attr('y', margin - 5).text('Number of Open Positions').attr('font-size', 12);
        svg.append('text').attr('x', width / 4).attr('y', margin * 1.25).text('Open DS Positions In Different Industries').attr('font-size', 17).style('font-weight', 'bold');
    })
    
}

function plotCardFour(filepath) {
    d3.csv(filepath).then(data => {

        var stateSym = {
            AZ: 'Arizona',
            AL: 'Alabama',
            AK: 'Alaska',
            AR: 'Arkansas',
            CA: 'California',
            CO: 'Colorado',
            CT: 'Connecticut',
            DC: 'District of Columbia',
            DE: 'Delaware',
            FL: 'Florida',
            GA: 'Georgia',
            HI: 'Hawaii',
            ID: 'Idaho',
            IL: 'Illinois',
            IN: 'Indiana',
            IA: 'Iowa',
            KS: 'Kansas',
            KY: 'Kentucky',
            LA: 'Louisiana',
            ME: 'Maine',
            MD: 'Maryland',
            MA: 'Massachusetts',
            MI: 'Michigan',
            MN: 'Minnesota',
            MS: 'Mississippi',
            MO: 'Missouri',
            MT: 'Montana',
            NE: 'Nebraska',
            NV: 'Nevada',
            NH: 'New Hampshire',
            NJ: 'New Jersey',
            NM: 'New Mexico',
            NY: 'New York',
            NC: 'North Carolina',
            ND: 'North Dakota',
            OH: 'Ohio',
            OK: 'Oklahoma',
            OR: 'Oregon',
            PA: 'Pennsylvania',
            RI: 'Rhode Island',
            SC: 'South Carolina',
            SD: 'South Dakota',
            TN: 'Tennessee',
            TX: 'Texas',
            UT: 'Utah',
            VT: 'Vermont',
            VA: 'Virginia',
            WA: 'Washington',
            WV: 'West Virginia',
            WI: 'Wisconsin',
            WY: 'Wyoming'
        };

        var stateFlipped = Object.fromEntries(Object.entries(stateSym).map(a => a.reverse()));
        var width = 685;
        var height = 700;
        var minR = 5;
        var maxR = 15;

        let svg = d3.select("#vis4").select("svg").attr("width", width).attr("height", height);
        let uniqueCityState = Array.from(d3.rollup(data, v => v.length, d => d['Location']));
        let topHiringCities = uniqueCityState.filter(d => d[1] >= 5);
        let uniqueLocation = topHiringCities.map(d => d[0]);
        let uniqueLocationCoord = [];
        uniqueLocation.forEach(d => {
            for (let i = 0; i < data.length; i++) {
                if (data[i]['Location'] === d) {
                    uniqueLocationCoord.push({
                        city: d,
                        num_job_posts: data.filter(entry => entry['Location'] === d).length,
                        long: parseFloat(data[i]['lng']),
                        lat: parseFloat(data[i]['lat'])
                    })
                }
            }
        })
        let realUnique = new Set();
        let realUniqueData = []
        uniqueLocationCoord.forEach(d => {
            if (!realUnique.has(d['city'])) {
                realUnique.add(d['city']);
                realUniqueData.push(d);
            }
        });
        let topHiringState = topHiringCities.map(d => [d[0].split(', ')[1], d[1]]);
        topHiringState = d3.flatRollup(topHiringState, v => d3.sum(v, d => d[1]), d => d[0]);
        let radiusScale = d3.scaleLinear().domain([0, d3.max(topHiringCities, d => d[1]) + 5]).range([minR, maxR]);
        let stateColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, d3.max(topHiringState, d => d[1] + 5)]);
        let colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, d3.max(topHiringCities, d => d[1]) + 5]);
        topHiringState = Object.fromEntries(topHiringState);

        const projection  = d3.geoAlbersUsa().scale(875).translate([width / 2, height / 2]);
        const pathgeo = d3.geoPath().projection(projection);
        const statemap = d3.json("data/us-states.json");
        statemap.then(map => {
            let paths = svg.selectAll("path").attr('class', 'state-border').data(map.features).enter().append("path");
            let comment = svg.append("text").attr('id', 'navbar1').style("opacity", 0).style("font-size", 15);
            paths.attr("d", pathgeo)
                .attr('stroke', 'black')
                .style('fill', d => stateFlipped[d.properties.name] in topHiringState? stateColor(topHiringState[stateFlipped[d.properties.name]]) : stateColor(0));
            svg.selectAll('circle').data(realUniqueData).enter().append('circle')
                .attr('class', 'cities')
                .attr("transform", d => "translate(" + projection([d.long, d.lat]) + ")")
                .attr('r', d => radiusScale(d["num_job_posts"]))
                .attr('stroke', '#5fc9f3')
                .attr('stroke-width', 3)
                .style('fill', d => colorScale(d["num_job_posts"]))
                .on("mouseover", (e, d) => {
                    comment.style('opacity', 1);
                })
                .on("mousemove", (e, d) => {
                    comment.text(`${d.city} has ${d["num_job_posts"]} new DS jobs`).attr('x', width / 3).attr('y', height / 5).style('font-weight', 'bold');
                })
                .on('mouseleave', () => {
                    comment.style('opacity', 0);
                });
        });

        let colorLegend = svg.append("g");
        const legend = d3.legendColor().scale(colorScale);
        colorLegend.attr("transform", `translate(${width - 100}, 30})`).call(legend);
        svg.append('text').attr('x', width / 3).attr('y', 75).text('Open Positions Across the US').attr('font-size', 17).style('font-weight', 'bold');
    });
    
}

function plotCardFive(filepath) {
    d3.csv(filepath).then(data => {

        var width = 700;
        var height = 700;
        var margin = 50;
        var radius = Math.min(width, height) / 2 - 1.75 * margin;
        var svg = d3.select("#vis5").select("svg")
                    .attr('width', width)
                    .attr('height', height)
                    .append("g")
                    .attr('transform', "translate(" + width / 2.65 + "," + height / 1.8 + ")");

        let jobCounts = d3.flatRollup(data, v => v.length, d => d.Industry);
        let popularIndustry = new Set();
        jobCounts.forEach(d => {if(d[1] >= 20) popularIndustry.add(d[0])});
        let popularJobsFromPopularIndustry = data.filter(d => popularIndustry.has(d.Industry));
        let grouped = d3.flatRollup(popularJobsFromPopularIndustry, v => v.length, d => d['Industry'], d => d['job_title_sim']);
        let defaultIndustry = 'IT Services';
        let jobs = ['Data scientist project manager', 'analyst', 'data analitics', 'data engineer', 'data modeler', 'data scientist', 'director', 'machine learning engineer', 'other scientist'];

        let colorScale = d3.scaleOrdinal().domain(jobs).range(d3.schemeSet3);
        let colorLegend = d3.select("#vis5").select("svg").append("g");

        function update(data1) {

            var pie = d3.pie().value(d => d[1]).sort((a, b) => d3.ascending(a.key, b.key))
            var data_ready = pie(Object.entries(data1))

            var u = svg.selectAll("path")
              .data(data_ready)
          
            u.exit().remove();

            u.enter().append('path').merge(u).transition().duration(1000)
                .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
                .attr('fill', d => colorScale(d.data[0]))
                .attr("stroke", "white")
                .style("stroke-width", "2px")
                .style("opacity", 1)
        }
        let sectionData = grouped.filter(d => d[0] === defaultIndustry);
        let industryData = []
        sectionData.forEach(d => industryData.push([d[1], d[2]]));
        industryData = Object.fromEntries(industryData);
        update(industryData);
        d3.selectAll('li').on('click', (e) => {
            defaultIndustry = e.target.innerText;
            sectionData = grouped.filter(d => d[0] === defaultIndustry);
            industryData = []
            sectionData.forEach(d => industryData.push([d[1], d[2]]));
            industryData = Object.fromEntries(industryData);
            update(industryData);

            d3.select("#vis5").select("svg").select('.tooltip-text')
                .text('Data Sciense Related Jobs In ' + defaultIndustry)
        });

        d3.select("#vis5").select("svg").append('text')
            .attr('class', 'tooltip-text')
            .attr('x', width / 8.5)
            .attr('y', height - margin / 3)
            .text('Data Sciense Related Jobs In ' + defaultIndustry)
            .attr('font-size', 20);
        
        const legend = d3.legendColor().scale(colorScale);
        colorLegend.attr("transform", `translate(${width - margin * 5.75}, ${margin / 4})`).call(legend);
    })
}

function plotCardSix(filepath) {
    d3.csv(filepath).then(data => {

        var height = 700;
        var width = 700;
        var margin = 45;

        let mostCommonJobs = d3.flatRollup(data, v => v.length, d => d['job_title_sim']).sort((a, b) => a[1] > b[1]);
        let topFour = new Set(mostCommonJobs.filter(d => d[1] > 100).map(d => d[0]));
        let filteredData = data.filter(d => topFour.has(d['job_title_sim']));
        topFour = Array.from(topFour);
        let xScale = d3.scaleBand().domain(topFour).range([margin, width-margin]).paddingInner(1).paddingOuter(.5);
        let yScale = d3.scaleLinear().domain([0, d3.max(filteredData, d => parseFloat(d["Avg Salary(K)"])) + 20]).range([height - margin, margin]);
        let medians = d3.flatRollup(filteredData, v => d3.median(v, d => parseFloat(d["Avg Salary(K)"])), d => d['job_title_sim']);
        let q1 = d3.flatRollup(filteredData, v => d3.quantile(v.map(d => parseFloat(d["Avg Salary(K)"])), 0.25), d => d['job_title_sim']);
        let q3 = d3.flatRollup(filteredData, v => d3.quantile(v.map(d => parseFloat(d["Avg Salary(K)"])), 0.75), d => d['job_title_sim']);
        let IQR = JSON.parse(JSON.stringify(q3));
        for (let i = 0; i < IQR.length; i++) {
            IQR[i][1] = IQR[i][1] - q1[i][1];
        }
        let mins = JSON.parse(JSON.stringify(q1));
        for (let j = 0; j < mins.length; j++) {
            mins[j][1] = mins[j][1] - 1.5 * IQR[j][1];
        }
        let maxs = JSON.parse(JSON.stringify(q3));
        for (let k = 0; k < maxs.length; k++) {
            maxs[k][1] = maxs[k][1] + 1.5 * IQR[k][1];
        }
        let summaryStat = [];
        for (let m = 0; m < medians.length; m++) {
            summaryStat.push({
                'title': topFour[m],
                'median': medians[m][1],
                'q1': q1[m][1],
                'q3': q3[m][1],
                'iqr': IQR[m][1],
                'min': mins[m][1],
                'max': maxs[m][1]
            })
        }

        let svg = d3.select('#vis6').select('svg').attr('width', width).attr('height', height);
        svg.append("g").attr("transform", `translate(0, ${height - margin})`).call(d3.axisBottom(xScale)).selectAll("text").style("text-anchor", "middle");
        svg.append("g").attr("transform", `translate(${margin}, 0)`).call(d3.axisLeft(yScale));
        let comment = svg.append('text').attr('id', 'navbar2').attr('font-size', 12).style('opacity', 0);

        svg.selectAll(".vertLines").data(summaryStat).enter().append("line")
            .attr("x1", function(d){return(xScale(d.title))})
            .attr("x2", function(d){return(xScale(d.title))})
            .attr("y1", function(d){return(yScale(d.min))})
            .attr("y2", function(d){return(yScale(d.max))})
            .attr("stroke", "black")
            .style("stroke-width", 5);

        var boxWidth = 85;
        svg.selectAll(".boxes").data(summaryStat).enter().append("rect")
            .attr("x", function(d){return(xScale(d.title)-boxWidth/2)})
            .attr("y", function(d){return(yScale(d.q3))})
            .attr("height", function(d){return(yScale(d.q1)-yScale(d.q3))})
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .style("fill", "#bbe4e9")
            .on("mouseover", (e, d) => {
                comment.style('opacity', 1);
            })
            .on("mousemove", (e, d) => {
                comment.text(`Position: ${d.title}--Upper Quant. Avg. Pay: ${d.max}K--Lower Quant. Avg. Pay: ${d.min}K--Median Avg. Pay: ${d.median}K`).attr('x', margin).attr('y', height - margin / 5).style('font-weight', 'bold');
            })
            .on('mouseleave', () => {
                comment.style('opacity', 0);
            });;
        svg.selectAll(".medianLines").data(summaryStat).enter()
            .append("line")
            .attr("x1", function(d){return(xScale(d.title)-boxWidth/2) })
            .attr("x2", function(d){return(xScale(d.title)+boxWidth/2) })
            .attr("y1", function(d){return(yScale(d.median))})
            .attr("y2", function(d){return(yScale(d.median))})
            .attr("stroke", "black")
            .style("width", 80);
        var jitterWidth = 40;
        svg.selectAll(".indPoints").data(filteredData).enter().append("circle")
                .attr("cx", function(d){return(xScale(d['job_title_sim']) - jitterWidth/2 + Math.random()*jitterWidth )})
                .attr("cy", function(d){return(yScale(parseFloat(d["Avg Salary(K)"])))})
                .attr("r", 5)
                .style("fill", "white")
                .attr("stroke", "black");

        svg.append('text').attr('x', margin - 15).attr('y', margin - 5).text('Annual Average Salary (K)').attr('font-size', 12);
        svg.append('text').attr('x', width - 2.25 * margin).attr('y', height - margin - 5).text('Position Title').attr('font-size', 12);
        svg.append('text').attr('x', width / 2.5).attr('y', margin * 1.5).text('Salary Distribution').attr('font-size', 16).style('font-weight', 'bold');
    })
}
