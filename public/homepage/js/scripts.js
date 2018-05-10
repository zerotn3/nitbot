(function($) {
	
	"use strict";

    $(window).load(function() {
        $(".pre-loder").delay(500).fadeOut('slow', function() {
            var newsLetterPopup = $('.news-letter-popup');
            newsLetterPopup.css({
                'visibility': 'visible',
                'opacity': 1
            });
        });
    });

	/*--------------------------------------------------------------
	    Preloder fadeout and newsletter popup
	--------------------------------------------------------------*/
    
    $('.close').on("click",function(){
    	var newsLetterPopUpBox = $('.news-letter-popup');
        newsLetterPopUpBox.css({
            'visibility': 'hidden',
            'opacity': 0
        });
        return false;
    });

	/*--------------------------------------------------------------
	    News letter Popup box close
	--------------------------------------------------------------*/
	
	// Fact Counter
	function financeCounter() {
		if($('.finance_counter').length){
			$('.finance_counter .counter.animated').each(function() {
		
				var $t = $(this),
					n = $t.find(".count-text").attr("data-stop"),
					r = parseInt($t.find(".count-text").attr("data-speed"), 10);
					
				if (!$t.hasClass("counted")) {
					$t.addClass("counted");
					$({
						countNum: $t.find(".count-text").text()
					}).animate({
						countNum: n
					}, {
						duration: r,
						easing: "linear",
						step: function() {
							$t.find(".count-text").text(Math.floor(this.countNum));
						},
						complete: function() {
							$t.find(".count-text").text(this.countNum);
						}
					});
				}
				
			});
		}
	}
	
	/*--------------------------------------------------------------
    	financeCounter 
	--------------------------------------------------------------*/

	// Elements Animation Important
	if($('.wow').length){
		var wow = new WOW(
		  {
			boxClass:     'wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset:       0,          // distance to the element when triggering the animation (default is 0)
			mobile:       true,       // trigger animations on mobile devices (default is true)
			live:         true       // act on asynchronously loaded content (default is true)
		  }
		);
		wow.init();
	}

	/*--------------------------------------------------------------
    	When document is Scrollig, do Important
	--------------------------------------------------------------*/

	$(window).on('scroll', function() {
		financeCounter();
	});

	/*--------------------------------------------------------------
    	When document is loading, do
	--------------------------------------------------------------*/
	//-- Making the header fixed --
	var jQueryheader = $('header#header');
	var jQueryheaderTop = jQueryheader.offset().top;

	$('.offset').height( jQueryheader.outerHeight() )
	 
	//-- Window Scroll Functions --
	   
	$(window).scroll(function(){
	  ($(window).scrollTop() > jQueryheaderTop) ? $('.header').addClass('fixedHeader') : jQuery('.header').removeClass('fixedHeader');
	});

	/*--------------------------------------------------------------
    	Fixed Header 
	--------------------------------------------------------------*/

	//-- Including the main nav contents in responsive main nav DIV --
	$('.mainNav .navTabs').clone().appendTo('.responsiveMainNav');

	//-- Show and Hide responsive nav --
	$('#responsiveMainNavToggler').on('click',(function(event){
	  event.preventDefault();
	  $('#responsiveMainNavToggler').toggleClass('opened');
	  $('.responsiveMainNav').slideToggle(1000);
	  $('.responsiveMainNav').addClass('nav-active');


	  if ( $('#responsiveMainNavToggler i').hasClass('fa-bars') )
	  {   
		  $('#responsiveMainNavToggler i').removeClass('fa-bars');
		  $('#responsiveMainNavToggler i').addClass('fa-close');
	  }else
	  {  
		  $('#responsiveMainNavToggler i').removeClass('fa-close');
		  $('#responsiveMainNavToggler i').addClass('fa-bars');
	  }
	}));
	// dropdown level 1
	if($(".responsiveMainNav .navTabs > li > a").parent().has("ul")) {
	  $(".responsiveMainNav .navTabs > li > a:first-child").addClass("toggleResponsive");
	  $(".responsiveMainNav .navTabs > li > a:last-child").removeClass("toggleResponsive");
	}

	$(".responsiveMainNav .navTabs > li > .toggleResponsive").on("click", function(e){
	  if($(this).parent().has("ul")) {
		e.preventDefault();
	  }
	  
	  if(!$(this).hasClass("activeLine")) {
		// hide any open menus and remove all other classes
		$(".responsiveMainNav .navTabs > li > .toggleResponsive").removeClass("activeLine");
		$(".responsiveMainNav .navTabs > li > .dropDown").slideUp(500);
		
		// open our new menu and add the activeLine class
		$(this).addClass("activeLine");
		$(this).next(".responsiveMainNav .navTabs > li > .dropDown").slideDown(500);
	  }
	  
	  else if(jQuery(this).hasClass("activeLine")) {
		$(this).removeClass("activeLine");
		$(this).next(".responsiveMainNav .navTabs > li > .dropDown").slideUp(500);
	  }
	});


	// dropdown level 2
	if($(".responsiveMainNav .navTabs > li > .dropDown > li > a").parent().has("ul")) {
	  $(".responsiveMainNav .navTabs > li > .dropDown > li > a:first-child").addClass("toggleResponsive");
	  $(".responsiveMainNav .navTabs > li > .dropDown > li > a:last-child").removeClass("toggleResponsive");
	}


	$(".responsiveMainNav .navTabs > li > .dropDown > li > .toggleResponsive").on("click", function(e){
	  if($(this).parent().has("ul")) {
		e.preventDefault();
	  }

	  if(!$(this).hasClass("activeLine")) {
		// hide any open menus and remove all other classes
		$(".responsiveMainNav .navTabs > li > .dropDown > li > .toggleResponsive").removeClass("activeLine");
		$(".responsiveMainNav .navTabs > li > .dropDown li .dropDown").slideUp(500);
		
		// open our new menu and add the activeLine class
		$(this).addClass("activeLine");
		$(this).next(".responsiveMainNav .navTabs > li > .dropDown li .dropDown").slideDown(500);
	  }
	  
	  else if($(this).hasClass("activeLine")) {
		$(this).removeClass("activeLine");
		$(this).next(".responsiveMainNav .navTabs > li > .dropDown li .dropDown").slideUp(500);
	  }
	});

	/*--------------------------------------------------------------
    	Responsive Menu
	--------------------------------------------------------------*/
	
	//Revolution Slider Style One
	if($('.main-slider .tp-banner').length){

		jQuery('.main-slider .tp-banner').show().revolution({
		  delay:10000,
		  startwidth:1200,
		  startheight:761,
		  hideThumbs:600,
	
		  thumbWidth:80,
		  thumbHeight:50,
		  thumbAmount:5,
	
		  navigationType:"bullet",
		  navigationArrows:"0",
		  navigationStyle:"preview3",
	
		  touchenabled:"on",
		  onHoverStop:"off",
	
		  swipe_velocity: 0.7,
		  swipe_min_touches: 1,
		  swipe_max_touches: 1,
		  drag_block_vertical: false,
	
		  parallax:"mouse",
		  parallaxBgFreeze:"on",
		  parallaxLevels:[7,4,3,2,5,4,3,2,1,0],
	
		  keyboardNavigation:"off",
	
		  navigationHAlign:"center",
		  navigationVAlign:"bottom",
		  navigationHOffset:0,
		  navigationVOffset:40,
	
		  soloArrowLeftHalign:"left",
		  soloArrowLeftValign:"center",
		  soloArrowLeftHOffset:20,
		  soloArrowLeftVOffset:0,
	
		  soloArrowRightHalign:"right",
		  soloArrowRightValign:"center",
		  soloArrowRightHOffset:20,
		  soloArrowRightVOffset:0,
	
		  shadow:0,
		  fullWidth:"on",
		  fullScreen:"off",
	
		  spinner:"spinner4",
	
		  stopLoop:"off",
		  stopAfterLoops:-1,
		  stopAtSlide:-1,
	
		  shuffle:"off",
	
		  autoHeight:"off",
		  forceFullWidth:"on",
	
		  hideThumbsOnMobile:"on",
		  hideNavDelayOnMobile:1500,
		  hideBulletsOnMobile:"on",
		  hideArrowsOnMobile:"on",
		  hideThumbsUnderResolution:0,
	
		  hideSliderAtLimit:0,
		  hideCaptionAtLimit:0,
		  hideAllCaptionAtLilmit:0,
		  startWithSlide:0,
		  videoJsPath:"",
		  fullScreenOffsetContainer: ""
	  });
		
	}
	
	/*--------------------------------------------------------------
    	Revolution Slider
	--------------------------------------------------------------*/

	//LightBox / Fancybox
	if($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect  : 'fade',
			closeEffect : 'fade',
			helpers : {
				media : {}
			}
		});
	}
	
	/*--------------------------------------------------------------
    	lightbox Fancybox
	--------------------------------------------------------------*/

	// Blog Item Carousel
	if ($('.blog-item-carousel').length) {
		
		$(".blog-item-carousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: true,
			navText: [ '<span class="flaticon flaticon-back"></span>', '<span class="flaticon flaticon-arrows-1"></span>' ],
			dots: false,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:1
		        },
		        768:{
		          items:1
		        },
		        1000:{
		          items:2
		        }
		    }
		});

	}
	
	/*--------------------------------------------------------------
    	blog item carousel
	--------------------------------------------------------------*/
	
	// testmonials Carousel
	if ($('.testmonialsCarousel').length) {
		
		$(".testmonialsCarousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: false,
			navText: [ '<span class="flaticon flaticon-back"></span>', '<span class="flaticon flaticon-arrows-1"></span>' ],
			dots: true,
			autoplay: false,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:1
		        },
		        768:{
		          items:1
		        },
		        1000:{
		          items:3
		        }
		    }

		});

	}

	/*--------------------------------------------------------------
    	Testmonials Carousel
	--------------------------------------------------------------*/
	
	$('.searchTrigger').on('click', function(){
			jQuery('.search_popup').fadeIn();
		});
		jQuery('.header-search-close').on('click', function(){
			jQuery('.search_popup').fadeOut();
	});
	/*--------------------------------------------------------------
    	Search Trigger end 
	--------------------------------------------------------------*/
	
	// singleTtemCarousel
	if ($('.single-item-carousel').length) {
		
		$(".single-item-carousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: false,
			navText: [ '<span class="flaticon flaticon-back"></span>', '<span class="flaticon flaticon-arrows-1"></span>' ],
			dots: false,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:1
		        },
		        768:{
		          items:1
		        },
		        1000:{
		          items:1
		        }
		    }

		});

	}

	/*--------------------------------------------------------------
    	single-item-carousel
	--------------------------------------------------------------*/
	
	// singleTtemCarousel
	if ($('.singleTtemCarousel').length) {
		
		$(".singleTtemCarousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: false,
			navText: [ '<span class="flaticon flaticon-back"></span>', '<span class="flaticon flaticon-arrows-1"></span>' ],
			dots: false,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:1
		        },
		        768:{
		          items:1
		        },
		        1000:{
		          items:1
		        }
		    }

		});

	}

	/*--------------------------------------------------------------
    	singleTtemCarousel
	--------------------------------------------------------------*/
	
	// ourTeamCarousel
	if ($('.ourTeamCarousel').length) {
		
		$(".ourTeamCarousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: false,
			navText: [ '<span class="flaticon flaticon-back"></span>', '<span class="flaticon flaticon-arrows-1"></span>' ],
			dots: true,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:1
		        },
		        768:{
		          items:1
		        },
		        1000:{
		          items:2
		        }
		    }

		});

	}

	/*--------------------------------------------------------------
    	ourTeam Carousel
	--------------------------------------------------------------*/
	
	  //-- Accordion 1 --
	  $(document).ready(function(){
	    $("#accordianShortCode .accordionRow > a").on("click", function(e){
	      if($(this).parent().has("div")) {
	        e.preventDefault();
	      }
	      
	      if(!$(this).hasClass("activeLine")) {
	        // hide any open menus and remove all other classes
	        $("#accordianShortCode .accordionRow > a").removeClass("activeLine");
	        $("#accordianShortCode .accordionRow > .accordion-content").removeClass("opened");
	        $("#accordianShortCode .accordionRow > .accordion-content").slideUp(500);
	        
	        // open our new menu and add the activeLine class
	        $(this).addClass("activeLine");
	        $("#accordianShortCode .accordionRow > .accordion-content").addClass("opened");
	        $(this).next(".accordion-content").slideDown(500);
	      }
	      
	      else if($(this).hasClass("activeLine")) {
	        $(this).removeClass("activeLine");
	        $("#accordianShortCode .accordionRow > .accordion-content").removeClass("opened");
	        $(this).next(".accordion-content").slideUp(500);
	      }
	    });
	  });
	/*--------------------------------------------------------------
    	ourTeam Carousel
	--------------------------------------------------------------*/
	
	// ourTeamCarousel
	if ($('.ourPartnerCarousel').length) {
		
		$(".ourPartnerCarousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: false,
			navText: [ '<span class="flaticon flaticon-back"></span>', '<span class="flaticon flaticon-arrows-1"></span>' ],
			dots: false,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:2
		        },
		        768:{
		          items:3
		        },
		        1000:{
		          items:5
		        }
		    }

		});

	}

	/*--------------------------------------------------------------
    	ourTeam Carousel
	--------------------------------------------------------------*/
	
	// Single Item Carousel
	if ($('.singleitem_carousel').length) {
		
		$(".singleitem_carousel").owlCarousel({
			loop:true,
			items: 1,
			margin: 0,
			nav: true,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			dots: false,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000
		});

	}
	
	/*--------------------------------------------------------------
    	singleitem_carousel
	--------------------------------------------------------------*/
	
	// Single Item Carousel
	if ($('.productCarousel').length) {
		
		$(".productCarousel").owlCarousel({
			loop:true,
			margin: 0,
			nav: false,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			dots: false,
			autoplay: true,
			smartSpeed: 1000,
			autoplayTimeout: 5000,
		    responsive:{
		        0:{
		          items:2
		        },
		        768:{
		          items:3
		        },
		        1000:{
		          items:4
		        }
		    }
		});

	}

	/*--------------------------------------------------------------
    	productCarousel
	--------------------------------------------------------------*/

  	$(document).on('click', '.quantity .plus, .quantity .minus', function (e) {

        // Get values
        var $qty = $(this).closest('.quantity').find('.qty'),
            currentVal = parseFloat($qty.val()),
            max = parseFloat($qty.attr('max')),
            min = parseFloat($qty.attr('min')),
            step = $qty.attr('step');

        // Format values
        if (!currentVal || currentVal === '' || currentVal === 'NaN') currentVal = 0;
        if (max === '' || max === 'NaN') max = '';
        if (min === '' || min === 'NaN') min = 0;
        if (step === 'any' || step === '' || step === undefined || parseFloat(step) === 'NaN') step = 1;

        // Change the value
        if ($(this).is('.plus')) {

            if (max && ( max == currentVal || currentVal > max )) {
                $qty.val(max);
            } else {
                $qty.val(currentVal + parseFloat(step));
            }

        } else {

            if (min && ( min == currentVal || currentVal < min )) {
                $qty.val(min);
            } else if (currentVal > 0) {
                $qty.val(currentVal - parseFloat(step));
            }

        }

        // Trigger change event
        $qty.trigger('change');

        e.preventDefault();

    });

	/*--------------------------------------------------------------
    	Quantity Count
	--------------------------------------------------------------*/

    $('.add-to-cart').on('click', function() {
	    $('.add-to-cart-content').toggleClass("open-cart");
	    return false;
	  });
	  $('.filter-search').on('click', function() {
	    $('.search-content').toggleClass("open-search");
	    return false;
	});

	/*--------------------------------------------------------------
    	Add to cart
	--------------------------------------------------------------*/


})(window.jQuery);

//-- Creating back to top btn --
jQuery(document).ready(function() {
jQuery('body').append(
  "<a href='#' class='back-to-top'>"+
    "<i class='fa fa-chevron-up'></i>"+
  "</a>"
);    
});
//-- scroll to top --
jQuery(document).ready(function() {
var offset = 600;
var duration = 1500;
jQuery(window).scroll(function() {
    if (jQuery(this).scrollTop() > offset) {
        jQuery('.back-to-top').addClass('fadeInup');
    } else {
        jQuery('.back-to-top').removeClass('fadeInup');
    }
});

jQuery('.back-to-top').click(function(e) {
    e.stopPropagation();
    jQuery('body,html').animate({
    scrollTop: 0
}, duration);
    return false;
})
});

/*Disable View Page Source Code*/
/*$(document).bind("contextmenu",function(e) {
 e.preventDefault();
});
$(document).keydown(function(event){
    if(event.keyCode==123){
    return false;
   }
else if(event.ctrlKey && event.shiftKey && event.keyCode==73){        
      return false;  //Prevent from ctrl+shift+i
   }
});

$(document).bind("contextmenu",function(e) {
 	e.preventDefault();
});



document.onkeydown = function(e) {
	if(e.keyCode == 123) {
	 	return false;
	}
	if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)){
	 	return false;
	}
	if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)){
	 	return false;
	}
	if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)){
	 	return false;
	}

	if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)){
	 	return false;
	}     
}
*/