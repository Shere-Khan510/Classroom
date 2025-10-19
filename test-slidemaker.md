# Slidemaker Formatting Test

## Test 1: Basic H2 with Subtitle
### This is a subtitle

* First bullet point
* Second bullet point
* Third bullet point

## Test 2: H2 without Subtitle

* Just a headline
* With some bullets
* No subtitle here

## Test 3: H2 with H3 Subtitle
### H3 should become subtitle

* Testing subtitle detection
* After H2 heading
* Should work correctly

# Test 4: H1 as Content Slide
### H3 should become subtitle here too

* H1 can also have subtitles
* Using H3 immediately after
* Should not create separate slide

## Test 5: Multiple Bullets

* Bullet one
* Bullet two
* Bullet three
* Bullet four
* Bullet five
* Testing multiple items

## Test 6: Long Text Wrapping
### Testing header with very long text that should wrap to multiple lines

* Short bullet
* This is a very long bullet point that should test the text wrapping capabilities
* Another short one

Two-Column: Basic Two Column

Left:
Left content line 1
Left content line 2
Left content line 3

Right:
Right content line 1
Right content line 2
Right content line 3

Two-Column: Two Column with Bullets

Left:
* Left bullet one
* Left bullet two
* Left bullet three

Right:
* Right bullet one
* Right bullet two
* Right bullet three

Two-Column: Asymmetric Content

Left:
* Lots of bullets
* On the left
* Multiple items
* Testing layout
* More items
* Even more

Right:
* Just a few
* On the right

## Test 7: H3 Standalone
### This H3 has no prior H2

* Should create its own slide
* Not be a subtitle
* Because no H2 before it

## Test 8: Empty Subtitle Test
### Just headline and subtitle

## Test 9: No Heading Test

* Starting with bullets
* No headline provided
* Should create "Untitled Slide"

## Test 10: Special Characters
### Testing "quotes" and 'apostrophes'

* Quote test: "hello world"
* Apostrophe test: it's working
* Ampersand: A & B
* Em dash: test — test

# Final Slide
### End of Formatting Tests

* No images or videos
* Only text formatting
* Easier to debug structure issues
