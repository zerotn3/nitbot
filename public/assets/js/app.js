$(document).ready(function () {
  Site.run();

  $('.banner-wrapper').data('size', 'big');

  $(window).scroll(function () {
    if ($(document).scrollTop() > 0) {
      if ($('.banner-wrapper').data('size') == 'big') {
        $('.banner-wrapper').data('size', 'small');
        $('.banner-wrapper').stop().animate({
          height: '66px',
        }, 800, function () {
          $('.site-navbar').addClass('fixed');
        });

        $('.content-banner').stop().animate({
          'margin-top': '-160px',
          'opacity': 0
        }, 1000);
      }
    } else {
      if ($('.banner-wrapper').data('size') == 'small') {
        $('.site-navbar').removeClass('fixed');
        $('.banner-wrapper').data('size', 'big');
        $('.banner-wrapper').stop().animate({
          height: '160px',
        }, 400, function () {

        });

        $('.content-banner').stop().animate({
          'margin-top': '0',
          'opacity': 1
        }, 1000);
      }
    }
  });

  if (window['Chartist'] == undefined)
    return;
  (function () {
    //chart-linearea-one
    new Chartist.Line('#widgetLineareaOne .ct-chart', {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
      series: [
        [0, 1, 3, 2, 3.5, 1.2, 1.5, 0]
      ]
    }, {
      low: 0,
      showArea: true,
      showPoint: false,
      showLine: false,
      fullWidth: true,
      chartPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      axisX: {
        showLabel: false,
        showGrid: false,
        offset: 0
      },
      axisY: {
        showLabel: false,
        showGrid: false,
        offset: 0
      }
    });
  })();

  // Widget Linearea Two
  // ---------------------
  (function () {
    //chart-linearea-two
    new Chartist.Line('#widgetLineareaTwo .ct-chart', {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      series: [
        [0, 0.5, 2.2, 2, 2.8, 2.3, 3.3, 2.5, 0]
      ]
    }, {
      low: 0,
      showArea: true,
      showPoint: false,
      showLine: false,
      fullWidth: true,
      chartPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      axisX: {
        showLabel: false,
        showGrid: false,
        offset: 0
      },
      axisY: {
        showLabel: false,
        showGrid: false,
        offset: 0
      }
    });
  })();

  // Widget Linearea Three
  // ---------------------
  (function () {
    //chart-linearea-three
    new Chartist.Line('#widgetLineareaThree .ct-chart', {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
      series: [
        [0, 2, 1.5, 3.5, 2.2, 3, 0.8, 0]
      ]
    }, {
      low: 0,
      showArea: true,
      showPoint: false,
      showLine: false,
      fullWidth: true,
      chartPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      axisX: {
        showLabel: false,
        showGrid: false,
        offset: 0
      },
      axisY: {
        showLabel: false,
        showGrid: false,
        offset: 0
      }
    });
  })();

  // Widget Linearea Four
  // ---------------------
  (function () {
    //chart-linearea-four
    new Chartist.Line('#widgetLineareaFour .ct-chart', {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      series: [
        [0, 1.2, 2.4, 2.5, 3.5, 2, 2.5, 1.2, 0]
      ]
    }, {
      low: 0,
      showArea: true,
      showPoint: false,
      showLine: false,
      fullWidth: true,
      chartPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      axisX: {
        showLabel: false,
        showGrid: false,
        offset: 0
      },
      axisY: {
        showLabel: false,
        showGrid: false,
        offset: 0
      }
    });
  })();

  Waves.attach('.page-content .btn-floating', ['waves-light']);
});