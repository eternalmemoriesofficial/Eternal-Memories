let paths = window.location.pathname.split("/").filter(Boolean);

// in db it will be in memorial_profiles table
let memorialProfileId = paths[1]
export let memorialProfile = {
  id: memorialProfileId, //optional
  name: "John Doe",
  birthdate: "1950-01-01",
  lastday: "2020-12-31",
  profilePic: "PlayerFilled.png",
  coverPhoto: undefined,
  remark: "A beloved member of the community.",
  memories: [
    {
      id: 1,
      title: "Graduation Day",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: "2021-01-01",
      uploadedBy: "Alice",
    },
  ],
  candles: [
    { name: "Visitor1", count: 5, timeStamps: [] },
    { name: "Visitor2", count: 3, timeStamps: [] },
  ],
  letters: [
    {
      content: "You are missed dearly.",
      sender: "Bob",
      timeStamp: "2021-02-01",
    },
  ],
};

export let memorialProfilesList = [
  {
    id: "john_doe_5",
    name: "John Doe",
    profilePic: "https://via.placeholder.com/150",
  },
];
