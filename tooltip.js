  var Tooltip = function() {

    var tooltip, top, left, headEl, dataEl, bodyEl, chartWidth, chartHeight, headline, dataItems;

    function create(parent, _chartWidth, _chartHeight, _headline, _dataItems) {
      chartWidth = _chartWidth;
      chartHeight = _chartHeight;
      dataItems = _dataItems;
      headline = _headline;
      tooltip = parent.append('div').classed('climate-factions__tooltip', true);
      headEl = tooltip.append('div').classed('climate-factions__tooltip-head', true);
      bodyEl = tooltip.append('div').classed('climate-factions__tooltip-body', true);
      dataEl = bodyEl.append('dl').classed('climate-factions__tooltip-data', true);
      return this;
    }

    function update(data) {
      headEl.text(data[headline]);
      dataEl.selectAll('*').remove();
      for (var key in dataItems) {
        if (dataItems.hasOwnProperty(key)) {
          var title = dataItems[key].title;
          var divisor = dataItems[key].divisor || 1;
          var value = data[key] ? data[key] : '-';
          var formattedValue = isNaN(value) ? value : _formatNumber(value / divisor);
          dataEl.append('dt').text(title);
          dataEl.append('dd').text(formattedValue);
        }
      }
    }

    function updatePosition(coords) {
      top = coords[1] > (chartHeight / 2) ? coords[1] - 210 : coords[1] - 10;
      left = coords[0] > (chartWidth / 2) ? coords[0] - 210 : coords[0] + 10;

      tooltip.style({
        top: top + 'px',
        left: left + 'px'
      });
    }

    function hide() {
      tooltip.style('display', 'none');
    }

    function show() {
      tooltip.style('display', 'block');
    }

    return {
      create: create,
      update: update,
      updatePosition: updatePosition,
      show: show,
      hide: hide
    };
  };