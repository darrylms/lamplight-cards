# Weather sensors

The weather cards only need a weather entity. Everything else on this page is optional and adds the
weather warnings and a few extra readings. It explains what each card reads and how to make the
warning sensors. There's also a full example for the UK Met Office.

[← Back to the README](../README.md)

## What the weather cards read

The sensors on this page are used by [`lamplight-weather` and `lamplight-day`](cards/weather.md),
and by the window cards [`lamplight-window-strip` and `lamplight-windows-detail`](cards/windows.md).

| Source | Key | Needed? | What it gives | Without it |
|---|---|---|---|---|
| Weather entity | `entity` (window cards: `weather`) | **Yes** | The sky, the hourly forecast, the rain line and chart, the Today popup | The card shows an error. On the window cards: no weather band or pill |
| Sun | `sun_entity` | Built in | The sky's light, sunrise, sunset, "after dark" | Home Assistant always has `sun.sun` |
| Warning | `warning_sensor` | No | The warning strip and its color | No warning |
| Warning count | `warning_count_sensor` | No | "2 warnings" | The card shows one warning |
| Warning start and end | `warning_start_sensor`, `warning_end_sensor` | No | "Starts tomorrow 23:00", "Ends in 3 hours", the warning on the Today timeline | The warning shows without times |
| Wind gust | `gust_sensor` | No | Strong gusts in the rain line | The card uses the weather entity's gust, if it has one |
| Feels like | `feels_like_sensor` | No | "Feels like 3°" beside the weather now | No feels-like on the weather card |
| UV index | `uv_sensor` | No | "UV 7" in the rain line on a dry, sunny day | No UV line |

## The weather entity

You can use any weather integration that gives an hourly forecast and uses Home Assistant's standard
weather conditions (`sunny`, `cloudy`, `rainy` and so on). The cards read the fields below from each
hour of the forecast. The more of them your integration fills in, the more the cards can tell you.

| Forecast field | Used for |
|---|---|
| `condition`, `temperature`, `datetime` | The sky, the hourly forecast, the day's story |
| `precipitation_probability` | The rain line, the rain chart, the Today timeline, the window weather band |
| `precipitation` | Telling light rain from heavy rain |
| `apparent_temperature` | How cold or warm the day feels, on the Today popup and the window band |
| `wind_speed`, `wind_gust_speed` | Windy days on the Today popup |
| `uv_index` | Sunny days on the Today popup |

If you aren't sure what yours gives you, go to **Developer tools > Actions** and run
`weather.get_forecasts` with `type: hourly` on your weather entity. Then look at the fields that
come back.

## The optional readings

For wind gusts, the card looks at the weather entity first and only uses a gust sensor if the entity
has no gust. The unit can be km/h, mph or m/s, because the card reads the sensor's own unit.

The weather card only shows the feels-like temperature when it's at least 2 degrees away from the
real one. A UV index of 6 or more is mentioned in the rain line, but only on a day when there is
nothing more important to say.

## The warning sensors

The warning sensors have to follow a simple format. If your weather service gives its warnings in
another form, a template sensor can convert them (see [Another
provider](#example-another-provider)).

| Sensor | State | Example |
|---|---|---|
| `warning_sensor` | The level word, then "warning of", then what. `none` when there is no warning | `Yellow warning of wind` |
| `warning_count_sensor` | A whole number. `0` when there is no warning | `2` |
| `warning_start_sensor` | The start time in ISO 8601, or `none` | `2026-12-04T23:00:00+00:00` |
| `warning_end_sensor` | The end time in ISO 8601, or `none` | `2026-12-05T13:00:00+00:00` |

The first word sets the color. It has to be `Yellow`, `Amber` or `Red`, and anything else is treated
as yellow.

| First word | Color | Severity |
|---|---|---|
| `Yellow` | Yellow | Moderate |
| `Amber` | Amber | Severe |
| `Red` | Red | Extreme |

The part after "warning of" is shown as the reason, for example "Wind". Once the end time has passed,
the card hides the warning, even if the sensor hasn't caught up yet.

> [!NOTE]
> These words come from the UK Met Office, because that's where Lamplight was first built. For now
> it's the only format Lamplight can read. You'll need a template sensor for any other service.

## Example: the UK Met Office

### The forecast

The Met Office integration needs an API key from the Met Office's Weather DataHub. You don't have to
pay for it, as the free plan is enough.

1. Register for an account on [Weather DataHub](https://datahub.metoffice.gov.uk/).
2. Choose a product and select your data. The integration uses the
   [Site Specific Global Spot](https://datahub.metoffice.gov.uk/pricing/site-specific) dataset.
3. Subscribe to its free tier plan. It allows 360 calls a day, which is plenty, but it only covers
   one location.
4. Find your API key in your account, under your subscription, and copy it.

Then add the Met Office integration in **Settings > Devices & services** and paste in your key. The
forecast will be for your home unless you drag the marker on the map somewhere else.

This gives you a weather entity with an hourly forecast, along with sensors for the feels-like
temperature, the UV index and the wind gust. The entity names depend on the name of your Met Office
location, so check them in **Developer tools > States**:

```yaml
type: custom:lamplight-weather
entity: weather.home
feels_like_sensor: sensor.home_feels_like_temperature
uv_sensor: sensor.home_uv_index
```

### The warnings

The Met Office publishes its warnings as a feed for each region of the UK. The feed for your region
is on its [RSS feeds page](https://weather.metoffice.gov.uk/guides/rss). The address ends in a
region code. Replace `REGION` in the example below with yours.

Add this to your `configuration.yaml`, then restart Home Assistant:

<details>
<summary>Show the YAML (71 lines)</summary>

```yaml
rest:
  - resource: https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/REGION
    scan_interval: 300
    sensor:
      # The most severe warning, for example "Yellow warning of wind", or "none".
      - name: Weather warning
        unique_id: weather_warning
        icon: mdi:weather-lightning
        value_template: >-
          {%- set titles = (value | regex_findall('<title>([^<]*)</title>'))[1:] -%}
          {%- set ranks = ['yellow', 'amber', 'red'] -%}
          {%- set ns = namespace(best=-1, title='none') -%}
          {%- for t in titles -%}
            {%- set w = t.split(' ')[0] | lower -%}
            {%- set r = ranks.index(w) if w in ranks else 0 -%}
            {%- if r > ns.best -%}
              {%- set ns.best = r -%}
              {%- set ns.title = t -%}
            {%- endif -%}
          {%- endfor -%}
          {{ 'none' if ns.best < 0 else (ns.title | replace('&amp;', '&')).split(' affecting ')[0] }}

      # How many warnings there are.
      - name: Weather warning count
        unique_id: weather_warning_count
        icon: mdi:counter
        value_template: "{{ value.count('<item>') }}"

      # When the most severe warning starts.
      - name: Weather warning start
        unique_id: weather_warning_start
        icon: mdi:clock-outline
        value_template: >-
          {%- set ranks = ['yellow', 'amber', 'red'] -%}
          {%- set ns = namespace(best=-1, item='') -%}
          {%- for it in value | regex_findall('(?s)<item>(.*?)</item>') -%}
            {%- set w = (it | regex_findall('<title>([^<]*)</title>') | first | default('')).split(' ')[0] | lower -%}
            {%- set r = ranks.index(w) if w in ranks else 0 -%}
            {%- if r > ns.best -%}
              {%- set ns.best = r -%}
              {%- set ns.item = it -%}
            {%- endif -%}
          {%- endfor -%}
          {%- set m = ns.item | regex_findall('valid from (\d{4} \w{3} \d{2} \w{3}) to') -%}
          {%- set t = strptime(now().year ~ ' ' ~ m[0], '%Y %H%M %a %d %b', none) if m else none -%}
          {%- if t is not none and t.month - now().month < -6 -%}
            {%- set t = t.replace(year=now().year + 1) -%}
          {%- endif -%}
          {{ 'none' if t is none else (t | as_local).isoformat() }}

      # When the most severe warning ends.
      - name: Weather warning end
        unique_id: weather_warning_end
        icon: mdi:clock-outline
        value_template: >-
          {%- set ranks = ['yellow', 'amber', 'red'] -%}
          {%- set ns = namespace(best=-1, item='') -%}
          {%- for it in value | regex_findall('(?s)<item>(.*?)</item>') -%}
            {%- set w = (it | regex_findall('<title>([^<]*)</title>') | first | default('')).split(' ')[0] | lower -%}
            {%- set r = ranks.index(w) if w in ranks else 0 -%}
            {%- if r > ns.best -%}
              {%- set ns.best = r -%}
              {%- set ns.item = it -%}
            {%- endif -%}
          {%- endfor -%}
          {%- set m = ns.item | regex_findall('valid from \d{4} \w{3} \d{2} \w{3} to (\d{4} \w{3} \d{2} \w{3})') -%}
          {%- set t = strptime(now().year ~ ' ' ~ m[0], '%Y %H%M %a %d %b', none) if m else none -%}
          {%- if t is not none and t.month - now().month < -6 -%}
            {%- set t = t.replace(year=now().year + 1) -%}
          {%- endif -%}
          {{ 'none' if t is none else (t | as_local).isoformat() }}
```

</details>

Then add the sensors to the cards:

```yaml
type: custom:lamplight-weather
entity: weather.home
warning_sensor: sensor.weather_warning
warning_count_sensor: sensor.weather_warning_count
warning_start_sensor: sensor.weather_warning_start
warning_end_sensor: sensor.weather_warning_end
```

`lamplight-day` takes the same four keys. The window cards only need `warning_sensor` and
`warning_count_sensor`.

### How the Met Office example works

- The feed lists each warning as an item. The first sensor picks the most severe one and keeps its
  title without the list of areas, for example "Yellow warning of wind".
- The times in the feed have no year, for example "valid from 2300 Thu 22 Oct to 1300 Fri 23 Oct".
  The start and end sensors add the year and turn the time into ISO 8601.
- The start and end sensors are deliberately not timestamp sensors. A timestamp sensor would log an
  error every time there's no warning and the state is `none`.
- The Met Office sends the feed with an odd content type, so Home Assistant can't read it as
  structured data. The templates search the raw text instead. It isn't pretty, but it works.

### If it doesn't work

The first `rest:` entry in your configuration needs a full restart, not just a reload. After that a
change can take a minute or more to reload, so give it some time before you decide that it has
failed. You can watch the sensors in **Developer tools > States**. When there is no warning, the
warning sensor shows `none` and the count shows `0`.

## Example: another provider

If your weather service gives its warnings in another form, you can use a few template sensors to
turn them into the format above. This example uses the
[Meteoalarm](https://www.home-assistant.io/integrations/meteoalarm/) integration, which covers much
of Europe. Its `awareness_level` attribute looks like `3; orange; Severe`, and its `awareness_type`
looks like `8; forest-fire`.

```yaml
template:
  - sensor:
      - name: Weather warning
        unique_id: weather_warning
        state: >-
          {%- if is_state('binary_sensor.meteoalarm', 'on') -%}
            {%- set level = (state_attr('binary_sensor.meteoalarm', 'awareness_level') or '').split(';') -%}
            {%- set color = level[1] | trim | lower if level | count > 1 else 'yellow' -%}
            {%- set word = {'yellow': 'Yellow', 'orange': 'Amber', 'red': 'Red'}.get(color, 'Yellow') -%}
            {%- set kind = (state_attr('binary_sensor.meteoalarm', 'awareness_type') or '').split(';') -%}
            {{ word }} warning of {{ kind[1] | trim if kind | count > 1 else 'weather' }}
          {%- else -%}
            none
          {%- endif -%}
      - name: Weather warning count
        unique_id: weather_warning_count
        state: "{{ 1 if is_state('binary_sensor.meteoalarm', 'on') else 0 }}"
      - name: Weather warning start
        unique_id: weather_warning_start
        state: "{{ state_attr('binary_sensor.meteoalarm', 'onset') or 'none' }}"
      - name: Weather warning end
        unique_id: weather_warning_end
        state: "{{ state_attr('binary_sensor.meteoalarm', 'expires') or 'none' }}"
```

Meteoalarm's orange becomes `Amber` so that the card picks the right color. For any other service,
open its sensor in **Developer tools > States** and look among its attributes for the level, the
type and the times. Then change the template to match. This one hasn't been tested on a live system,
so please treat it as a starting point.

## If something is wrong

| What you see | What to do |
|---|---|
| The weather card shows an error | Check `entity`. It must be a `weather.` entity |
| No rain line or rain chart | Your forecast may have no `precipitation_probability`. Check it with `weather.get_forecasts` |
| A warning shows in yellow, but it is amber | The warning sensor's first word must be `Amber`. Check its state |
| A warning stays after it has ended | Give the cards the start and end sensors. The cards hide a warning once its end time passes |
| No feels-like on the weather card | Give it a `feels_like_sensor`. The difference must be 2 degrees or more |
