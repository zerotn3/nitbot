//--Portfolio Mixitup Filter--
jQuery(document).ready(function() {
  // jQuery('#Grid').mixitup('toGrid');
  jQuery('#projectGrid').mixitup({
    targetSelector: '.mix',
    filterSelector: '.filter',
    sortSelector: '.sort',
    buttonEvent: 'click',
    effects: ['fade','scale'/*,'blur'*/],
    listEffects: null,
    easing: 'smooth',
    layoutMode: 'grid',
    targetDisplayGrid: 'inline-block',
    targetDisplayList: 'block',
    gridClass: '.mix',
    listClass: '',
    transitionSpeed: 600,
    showOnLoad: 'all',
    sortOnLoad: false,
    multiFilter: false,
    filterLogic: 'or',
    resizeContainer: true,
    minHeight: 0,
    failClass: 'fail',
    perspectiveDistance: '3000',
    perspectiveOrigin: '50% 50%',
    animateGridList: true,
    onMixLoad: null,
    onMixStart: null,
    onMixEnd: null
  });

});
//--------------------------------------------------------------------------------------------
