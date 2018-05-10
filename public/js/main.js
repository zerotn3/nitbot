$(document).ready(function () {
  var countEnding = $('#countdown input').val();
  var dateEnding = countEnding ? Date.parse(countEnding) : Date.parse(new Date()) + 30 * 24 * 60 * 60 * 1000;
  var deadline = new Date(dateEnding);
  initializeClock('countdown', deadline);
});

function showAvatarInTree() {
  $('#referrals div.node img').each(function (idx, elm) {
    //img.profile(data-name=user.full_nm, alt=user.full_nm, style="border: 1px solid white")
    var nodeNm = $(elm).next().html();

    $(elm).attr('data-name', nodeNm)
      .css('width', '65px')
      .data('name', nodeNm);

    $(elm).next().html(nodeNm.length > 8 ? (nodeNm.substring(0, 8) + '...') : nodeNm);

    var contactData = $(elm).next().next().next().html();
    var ctArr = contactData.split('|');
    var email = ctArr[0];
    var phone = ctArr[1];
    var sponsor = ctArr[2];
    var virSponsor = ctArr[3];
    var wallet = JSON.parse(ctArr[4]);
    var lastReceiver = ctArr[5];

    var dataContent = 'Level: ' + $(elm).next().next().html()
      + ' <br />' + 'Email: ' + email
      + ' <br /> Phone: ' + phone
      + ' <br /> Sponsor: ' + sponsor
      + ' <br /> Parent: ' + virSponsor
      + ' <br /> Wallet: ' + 'W: ' + wallet.withdrawn + ', D: ' + wallet.direct + ', U: ' + wallet.upgrade + ', O: ' + wallet.overflow
      + ' <br /> Last Receiver: ' + lastReceiver;

    $(elm).parent()
      .attr('data-toggle', 'popover')
      .attr('data-placement', 'top')
      .attr('data-html', 'true')
      .attr('title', nodeNm)
      .attr('data-content', dataContent)
      .popover({
        trigger: 'hover'
      });
  });
}

function getTimeRemaining(endTime) {
  var t = Date.parse(endTime) - Date.parse(new Date());
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  var days = Math.floor(t / (1000 * 60 * 60 * 24));
  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}

function initializeClock(id, endTime) {
  var clock = $('#' + id);
  var daysSpan = clock.find('.days');
  var hoursSpan = clock.find('.hours');
  var minutesSpan = clock.find('.minutes');
  var secondsSpan = clock.find('.seconds');

  function updateClock() {
    var t = getTimeRemaining(endTime);

    daysSpan.html(t.days);
    hoursSpan.html(('0' + t.hours).slice(-2));
    minutesSpan.html(('0' + t.minutes).slice(-2));
    secondsSpan.html(('0' + t.seconds).slice(-2));

    if (t.total <= 0) {
      clearInterval(timeInterval);
    }
  }

  updateClock();
  var timeInterval = setInterval(updateClock, 1000);
}