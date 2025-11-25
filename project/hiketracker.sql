drop table Has cascade constraints;
drop table Saves cascade constraints;
drop table Needs cascade constraints;
drop table Feedback cascade constraints;
drop table Hike2 cascade constraints;
drop table Hike1 cascade constraints;
drop table ForestFireWarning cascade constraints;
drop table AnimalSighting cascade constraints;
drop table WeatherWarning cascade constraints;
drop table Equipment cascade constraints;
drop table AppUser cascade constraints;
drop table Preference cascade constraints;
drop table Location2 cascade constraints;
drop table Location1 cascade constraints;
drop table SafetyHazard cascade constraints;

create table SafetyHazard
  (SafetyHazardID INT not null,
   HazardType VARCHAR2(20) not null,
   primary key (SafetyHazardID));

create table Preference
  (PreferenceID INT not null,
   Distance INT,
   Duration INT,
   Elevation INT,
   Difficulty INT check (Difficulty between 1 and 10),
   primary key (PreferenceID));

create table AppUser
  (UserID INT not null,
   Name VARCHAR2(20),
   PreferenceID INT unique,
   Email VARCHAR2(30) unique,
   PhoneNumber VARCHAR2(20) unique,
   primary key (UserID),
   foreign key (PreferenceID) references Preference(PreferenceID)
     on delete set null);

create table Equipment
  (EquipmentID INT not null,
   Name VARCHAR2(20),
   Kind VARCHAR2(20),
   primary key (EquipmentID));

create table Location1
  (PostalCode VARCHAR2(20) not null,
   Country VARCHAR2(20) not null,
   Province_State VARCHAR2(20),
   City VARCHAR2(20),
   primary key (PostalCode, Country));

create table Location2
  (LocationID INT not null,
   Address VARCHAR2(20),
   PostalCode VARCHAR2(20),
   Country VARCHAR2(20),
   Latitude DECIMAL(10, 8),
   Longitude DECIMAL(11, 8),
   primary key (LocationID));

create table Hike1
  (Kind VARCHAR2(20) not null,
   Distance INT not null,
   Elevation INT not null,
   Duration INT not null,
   Difficulty INT check (Difficulty between 1 and 10),
   primary key (Kind, Distance, Elevation, Duration));

create table Hike2
  (HikeID INT not null,
   LocationID INT not null,
   Name VARCHAR2(20),
   Kind VARCHAR2(20),
   Season VARCHAR2(20),
   TrailCondition INT check (TrailCondition between 1 and 10),
   Duration INT,
   Elevation INT,
   Distance INT,
   primary key (HikeID),
   foreign key (LocationID) references Location2(LocationID));

create table WeatherWarning
  (SafetyHazardID INT not null,
   Description VARCHAR2(500),
   DateIssued DATE,
   SeverityLevel INT check (SeverityLevel between 1 and 10),
   Kind VARCHAR2(20),
   primary key (SafetyHazardID),
   foreign key (SafetyHazardID) references SafetyHazard(SafetyHazardID)
     on delete cascade);

create table AnimalSighting
  (SafetyHazardID INT not null,
   Description VARCHAR2(500),
   DateIssued DATE,
   Animal VARCHAR2(20),
   primary key (SafetyHazardID),
   foreign key (SafetyHazardID) references SafetyHazard(SafetyHazardID)
     on delete cascade);

create table ForestFireWarning
  (SafetyHazardID INT not null,
   Description VARCHAR2(500),
   DateIssued DATE,
   Rating INT check (Rating between 1 and 5),
   Cause VARCHAR2(500),
   primary key (SafetyHazardID),
   foreign key (SafetyHazardID) references SafetyHazard(SafetyHazardID)
     on delete cascade);

create table Needs
  (EquipmentID INT not null,
   HikeID INT not null,
   primary key (EquipmentID, HikeID),
   foreign key (EquipmentID) references Equipment(EquipmentID)
     on delete cascade,
   foreign key (HikeID) references Hike2(HikeID)
     on delete cascade);

create table Saves
  (UserID INT not null,
   HikeID INT not null,
   primary key (UserID, HikeID),
   foreign key (UserID) references AppUser(UserID)
     on delete cascade,
   foreign key (HikeID) references Hike2(HikeID)
     on delete cascade);

create table Has
  (HikeID INT not null,
   SafetyHazardID INT not null,
   primary key (HikeID, SafetyHazardID),
   foreign key (HikeID) references Hike2(HikeID)
     on delete cascade,
   foreign key (SafetyHazardID) references SafetyHazard(SafetyHazardID)
     on delete cascade);

create table Feedback
  (FeedbackID INT not null,
   Rating INT check (Rating between 1 and 5),
   Review VARCHAR2(1000),
   DateSubmitted DATE,
   UserID INT not null,
   HikeID INT not null,
   primary key (FeedbackID),
   foreign key (UserID) references AppUser(UserID)
     on delete cascade,
   foreign key (HikeID) references Hike2(HikeID)
     on delete cascade);

insert into SafetyHazard values (00000, 'Forest Fire');
insert into SafetyHazard values (00001, 'Animal');
insert into SafetyHazard values (00002, 'Weather');
insert into SafetyHazard values (00003, 'Forest Fire');
insert into SafetyHazard values (00004, 'Animal');
insert into SafetyHazard values (00005, 'Animal');
insert into SafetyHazard values (00006, 'Forest Fire');
insert into SafetyHazard values (00007, 'Forest Fire');
insert into SafetyHazard values (00008, 'Weather');
insert into SafetyHazard values (00009, 'Animal');
insert into SafetyHazard values (00010, 'Weather');
insert into SafetyHazard values (00011, 'Weather');
insert into SafetyHazard values (00012, 'Forest Fire');
insert into SafetyHazard values (00013, 'Animal');
insert into SafetyHazard values (00014, 'Weather');

insert into Preference values (00000, 30, 3, 1567, 8);
insert into Preference values (00001, 2, 1, 50, 1);
insert into Preference values (00002, 45, 8, 2402, 10);
insert into Preference values (00003, 10, 2, 200, 5);
insert into Preference values (00004, 6, 2, 27, 3);

insert into AppUser values (00000, 'Jerico Martinez', 00000, 'jerico@example.com', '1234567890');
insert into AppUser values (00001, 'Chester Wong', 00001, 'chester@example.com', '1234567891');
insert into AppUser values (00002, 'Dilreet Raju', 00002, 'dilreet@example.com', '1234567892');
insert into AppUser values (00003, 'Mark Zuck', 00003, 'mark@example.com', '1234567893');
insert into AppUser values (00004, 'Gregor Kiczales', 00004, 'gregor@example.com', '1234567894');

insert into WeatherWarning values (00008, 'Heavy rain expected to cause flash floods.', TO_DATE('2025-10-15', 'YYYY-MM-DD'), 3, 'Rainfall');
insert into WeatherWarning values (00010, 'Harsh winds with speeds reaching 80 km/h.', TO_DATE('2025-10-17', 'YYYY-MM-DD'), 4, 'Wind');
insert into WeatherWarning values (00011, 'Heavy snowfall expected to reach 6 inches.', TO_DATE('2025-10-18', 'YYYY-MM-DD'), 5, 'Snowfall');
insert into WeatherWarning values (00014, 'Heavy rain causing potential mudslides.', TO_DATE('2025-10-22', 'YYYY-MM-DD'), 4, 'Rainfall');
insert into WeatherWarning values (00002, 'Extreme temperature expected to reach 40°C.', TO_DATE('2025-06-20', 'YYYY-MM-DD'), 5, 'Extreme Heat');

insert into AnimalSighting values (00001, 'Moose spotted 5 km into trail.', TO_DATE('2025-06-20', 'YYYY-MM-DD'), 'Moose');
insert into AnimalSighting values (00004, 'Coyotes spotted on trails.', TO_DATE('2025-08-19', 'YYYY-MM-DD'), 'Coyote');
insert into AnimalSighting values (00005, 'Black bear spotted.', TO_DATE('2025-09-01', 'YYYY-MM-DD'), 'Black Bear');
insert into AnimalSighting values (00009, 'Black bear spotted munching on berries.', TO_DATE('2025-10-16', 'YYYY-MM-DD'), 'Black Bear');
insert into AnimalSighting values (00013, 'Mother brown bear and cub.', TO_DATE('2025-10-20', 'YYYY-MM-DD'), 'Brown Bear');

insert into ForestFireWarning values (00000, 'Forest fire on trail', TO_DATE('2025-06-10', 'YYYY-MM-DD'), 5, 'Lightning strike and dry vegetation');
insert into ForestFireWarning values (00003, 'Forest fire 50 km away causing decreased vision and air quality.', TO_DATE('2025-07-25', 'YYYY-MM-DD'), 4, 'Prolonged heatwave and drought');
insert into ForestFireWarning values (00006, 'Forest fire 10 km from trail causing decreased vision and air quality.', TO_DATE('2025-09-21', 'YYYY-MM-DD'), 3, 'Nearby human activity');
insert into ForestFireWarning values (00007, 'Forest fire 2 km from trail causing decreased vision and air quality.', TO_DATE('2025-09-30', 'YYYY-MM-DD'), 4, 'Rekindled fire from camp area');
insert into ForestFireWarning values (00012, 'Forest fire causing decreased air quality.', TO_DATE('2025-10-19', 'YYYY-MM-DD'), 3, 'Airborne embers from distant wildfire');

insert into Hike1 values ('Loop', 12, 400, 180, 3);
insert into Hike1 values ('Out-and-Back', 8, 250, 120, 2);
insert into Hike1 values ('Summit', 15, 800, 240, 4);
insert into Hike1 values ('Coastal', 25, 500, 360, 5);
insert into Hike1 values ('Forest Trail', 6, 150, 90, 1);

insert into Location1 values ('V5A1S6', 'Canada', 'British Columbia', 'Burnaby');
insert into Location1 values ('V6B1L4', 'Canada', 'British Columbia', 'Vancouver');
insert into Location1 values ('V9T2M1', 'Canada', 'British Columbia', 'Nanaimo');
insert into Location1 values ('V8P1Y2', 'Canada', 'British Columbia', 'Victoria');
insert into Location1 values ('V2L4W1', 'Canada', 'British Columbia', 'Prince George');

insert into Location2 values (00000, '123 Mountain Rd', 'V5A1S6', 'Canada', 49.27891234, -122.91987321);
insert into Location2 values (00001, '88 Summit Trail', 'V6B1L4', 'Canada', 49.28234567, -123.11578912);
insert into Location2 values (00002, '42 Riverbend Way', 'V9T2M1', 'Canada', 49.16482718, -123.93561429);
insert into Location2 values (00003, '75 Valley Loop', 'V8P1Y2', 'Canada', 48.45671235, -123.35456783);
insert into Location2 values (00004, '10 Glacier Ave', 'V2L4W1', 'Canada', 53.91706455, -122.74966927);

insert into Hike2 values (00000, 00000, 'Eagle Ridge Trail', 'Loop', 'Summer', 4, 180, 400, 12);
insert into Hike2 values (00001, 00001, 'Maple Peak Trail', 'Out-and-Back', 'Spring', 3, 120, 250, 8);
insert into Hike2 values (00002, 00002, 'Riverside Path', 'Coastal', 'Fall', 5, 240, 500, 25);
insert into Hike2 values (00003, 00003, 'Victoria Bluff Trail', 'Summit', 'Winter', 2, 300, 800, 15);
insert into Hike2 values (00004, 00004, 'Glacier Point Trail', 'Loop', 'Summer', 4, 360, 1000, 20);

insert into Feedback values (00000, 5, 'Incredible views and well-maintained path.', TO_DATE('2025-08-01', 'YYYY-MM-DD'), 00000, 00000);
insert into Feedback values (00001, 4, 'Beautiful trail but slightly muddy.', TO_DATE('2025-08-02', 'YYYY-MM-DD'), 00001, 00001);
insert into Feedback values (00002, 3, 'Too crowded on weekends.', TO_DATE('2025-08-05', 'YYYY-MM-DD'), 00002, 00000);
insert into Feedback values (00003, 5, 'Amazing hike, great for beginners.', TO_DATE('2025-09-10', 'YYYY-MM-DD'), 00003, 00002);
insert into Feedback values (00004, 4, 'Challenging climb but rewarding summit.', TO_DATE('2025-09-15', 'YYYY-MM-DD'), 00004, 00004);

insert into Equipment values (00000, 'Tent', 'Camping Gear');
insert into Equipment values (00001, 'Rain Jacket', 'Clothing');
insert into Equipment values (00002, 'First-Aid Kit', 'Essentials');
insert into Equipment values (00003, 'Hiking Shoes', 'Clothing');
insert into Equipment values (00004, 'Water Bottle', 'Essentials');

insert into Needs values (00004, 00000);
insert into Needs values (00004, 00001);
insert into Needs values (00004, 00002);
insert into Needs values (00004, 00003);
insert into Needs values (00004, 00004);

insert into Saves values (00000, 00000);
insert into Saves values (00001, 00000);
insert into Saves values (00002, 00000);
insert into Saves values (00003, 00000);
insert into Saves values (00004, 00000);

insert into Has values (00000, 00000);
insert into Has values (00000, 00001);
insert into Has values (00002, 00009);
insert into Has values (00002, 00012);
insert into Has values (00003, 00011);
