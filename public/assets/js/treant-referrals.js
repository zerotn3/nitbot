var config = {
    container: "#referrals",
    rootOrientation: 'NORTH', // NORTH || EAST || WEST || SOUTH
    // levelSeparation: 30,
    siblingSeparation: 20,
    subTeeSeparation: 60,
    scrollbar: "fancy",

    connectors: {
      type: 'step'
    },
    node: {
      HTMLclass: 'nodeExample1'
    }
  },
  ceo = {
    text: {
      name: "Mark Hill",
      title: "Chief executive officer",
    },
    image: "../assets/images/headshots/2.jpg",
    HTMLid: "584baa2b5911dffc7525fe6c"
  },

  cto = {
    parent: ceo,
    text: {
      name: "Joe Linux",
      title: "Chief Technology Officer",
    },
    image: "../assets/images/headshots/1.jpg",
    HTMLid: "584baabd5911dffc7525fe6d"
  },
  cdo = {
    parent: ceo,
    text: {
      name: "John Green",
      title: "Chief accounting officer",
    },
    image: "../assets/images/headshots/6.jpg",
    HTMLid: "584bab105911dffc7525fe6e"
  },
  cio = {
    parent: ceo,
    text: {
      name: "Ron Blomquist",
      title: "Chief Information Security Officer"
    },
    image: "../assets/images/headshots/8.jpg",
    HTMLid: "584bab665911dffc7525fe6f"
  },
  ciso = {
    parent: cto,
    text: {
      name: "Michael Rubin",
      title: "Chief Innovation Officer",
    },
    image: "../assets/images/headshots/9.jpg",
    HTMLid: "ciso"
  },
  cio2 = {
    parent: cdo,
    text: {
      name: "Erica Reel",
      title: "Chief Customer Officer"
    },
    image: "../assets/images/headshots/10.jpg",
    HTMLid: "cio2"
  };

ALTERNATIVE = [
  config,
  ceo,
  cto,
  cdo,
  cio,
];

ccc = [
  config,
  ceo,
  cto,
  cdo,
  cio,
];