var express = require('express');
var router = express.Router();
var {
  Attraction
} = require('../models');
const Sequelize = require('sequelize');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});
// 辅助函数，将景点转换为GeoJSON格式
function toGeoJSONFeature(attraction) {
  return {
    type: 'Feature',
    geometry: attraction.point,
    properties: {
      name: attraction.name,
      address: attraction.address,
      type: attraction.type
    }
  };
}

// 根据名称查询
router.get('/attractions/:name', async (req, res, next) => {
  let name = req.params.name;
  let attractions = await Attraction.findAll({
    where: {
      name: {
        [Sequelize.Op.like]: `%${name}%`
      }
    }
  });

  let features = attractions.map(toGeoJSONFeature);
  res.json({
    type: 'FeatureCollection',
    features: features
  });
});

// 获取全部
router.get('/attractions-all', async (req, res, next) => {
  let attractions = await Attraction.findAll();

  let features = attractions.map(toGeoJSONFeature);
  res.json({
    type: 'FeatureCollection',
    features: features
  });
});
router.get('/attractions', async (req, res, next) => {
  let {
    lng,
    lat,
    radius
  } = req.query;
  radius = parseFloat(radius); // 假设 radius 是以米为单位

  const point = `POINT(${lng} ${lat})`;

  try {
    let attractions = await Attraction.findAll({
      attributes: {
        include: [
          // 添加距离计算
          [Sequelize.fn('ST_Distance',
            Sequelize.fn('ST_GeographyFromText', Sequelize.literal(`'${point}'`)),
            Sequelize.fn('ST_GeographyFromText', Sequelize.fn('ST_AsText', Sequelize.col('point')))
          ), 'distance']
        ]
      },
      where: Sequelize.literal(`ST_Distance(ST_GeographyFromText('${point}'), ST_GeographyFromText(ST_AsText(point))) < ${radius}`)
    });

    let features = attractions.map(toGeoJSONFeature);
    res.json({
      type: 'FeatureCollection',
      features: features
    });
  } catch (error) {
    console.error("Error in distance query: ", error);
    res.status(500).send("Internal Server Error");
  }
});








module.exports = router;