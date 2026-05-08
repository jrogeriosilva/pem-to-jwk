export interface SamplePem {
  id: string
  title: string
  description: string
  pem: string
}

export const SAMPLE_PEMS: SamplePem[] = [
  {
    id: "rsa-2048-spki",
    title: "RSA-2048 Public Key",
    description: "SubjectPublicKeyInfo (SPKI) — kty: RSA",
    pem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28Iy5bn49miMiSqFTVVr
6ODEb3AUDKBm5KyItthFkoHRebwT4TSp/jO9vidh+22Wu1EoiyvTgCM+Xsy+1nnF
jIb48LTOrCsb8KWDC25fWdt0Z1q3PfK2D3SjpEZG1EtLJaqZRqB1wboeuTodF+LP
Iy/1WQFsRVuHeLy5nvqh+f9rk5+ilDF2Gyti9Eoon4/Xa2S0fPw1xGmbOB41Tl7a
68iZk5KwEcS497+l3Ar+y3objp/C3LaA1PCzSNJnrhHCW+Vh1DUUVXjyGuzGN9g7
21Iuyt39Qnd7fp89pgcEnzaB2yImST2Ie+yPl+fdMjusc9kCC6NIRw3R3moXEg5I
FQIDAQAB
-----END PUBLIC KEY-----`,
  },
  {
    id: "rsa-2048-pkcs8",
    title: "RSA-2048 Private Key",
    description: "PKCS#8 — kty: RSA, all CRT params",
    pem: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbwjLlufj2aIyJ
KoVNVWvo4MRvcBQMoGbkrIi22EWSgdF5vBPhNKn+M72+J2H7bZa7USiLK9OAIz5e
zL7WecWMhvjwtM6sKxvwpYMLbl9Z23RnWrc98rYPdKOkRkbUS0slqplGoHXBuh65
Oh0X4s8jL/VZAWxFW4d4vLme+qH5/2uTn6KUMXYbK2L0Siifj9drZLR8/DXEaZs4
HjVOXtrryJmTkrARxLj3v6XcCv7LehuOn8LctoDU8LNI0meuEcJb5WHUNRRVePIa
7MY32DvbUi7K3f1Cd3t+nz2mBwSfNoHbIiZJPYh77I+X590yO6xz2QILo0hHDdHe
ahcSDkgVAgMBAAECggEAIc24iI/X1Qd1/q90u9WU+MiCTuX9n4eY7DoB+aZA5W1k
rIYaxLyWHY0V9ccXElbkJcIxK189dGt3b5utC07F7XzhlB0r4V3sOVMsWjjLIAZa
3H8eyr+n866scVuCD6vZTlz0oOGT243mpfVjfkYcOLxq0Bsg7XZL222kW+kPu2We
ypxezw/lsgwnTER4BD6Af4YNwh8dkPBe4+MC4FcgKaf4iATB6WkmwUBlJTJWTCei
Ux/kAQOLv/GW+mGcn8EGAutGB3gIuDOSBZouJN/dBLhTeg282hdrMXrjHCbAN4pQ
C9GF5zxtvyupmSJQ0TD0SlJJuBOZKz/M9mjpP/2njQKBgQDxLl+eqPLGMBvfObZk
O+MKDPou27T9jmoMl1JYW4ELEk6zQ72YZjgCurk+6uuj2KYn9ucl6hzjn7u5DVo/
OvNQH7vw8UNR52QuEDPS1LVJCEDH258Kt2z23ueo/WZ/THVh9PA5wEs+sbYzjutP
7DtoeZuhOj2FLlaJJXrP6s/TQwKBgQDpQtywAVHqtRn+X2RmSQxxl9gQ3M4/wGya
yRL/oN5BmJ2f60n79e2PwXpXqjWWj9e5HZ6upmC2IfMOS2bqRm8UQIxAY9Ghg1Qr
cW/y08KUccYNW/QWYPsytFXSsi3Hq9L8wAnO2uksEDbMDfdL5UepfzcN0fK4O03D
7iOSzjBFxwKBgQCaWJge/HYpuV4M9G0yJlU8+GMfm8FvRzW9CxZKr3yc7kFpXd+2
6SvNK1wj1MmqmJp1FwCEdhe44F+NpOrtbjeKPlTTdEMl5lRpWjsgILpHm72BaZ6V
iB92ud49erWen/q7Drqx6sr8u1QkGMGk60R1ruWXP6NhWO9OY6r95oLL6wKBgGtj
mO5+7RO9ZMYzbKman9v8KEE7Jsk68cUhJVoC2dAhTxA85sbVJhW04XpSpnE2r/5N
oKyPdJ7lalz+YdchrioIvYk3a1+Mcse9ZejJjR+CccfcubdD1uI1G/3wghsXA//Q
+bL+HbNnk5LGK0AJwsBKDTKToccnplm53S7NNnQpAoGANU4QL4d4Xyc01lXPVsgR
erjeSxIzqNRN+cJQjqY9miTVm3efxR/PVV+9dr7d6cUU4RIYjKpA7yiA6NmDVWoX
0wzVavuDEttmbweeN0Mj+v1Vl4i+8ghY0NS9k4Ylu1/jeyssB7gJXcq1fvx3X89H
/Q+7Jhv/35zeOIK3rgvKY4I=
-----END PRIVATE KEY-----`,
  },
  {
    id: "p256-spki",
    title: "P-256 Public Key",
    description: "SubjectPublicKeyInfo — kty: EC, crv: P-256",
    pem: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE0ODcv22X5FvZYrE+TOXga7BpI9Ks
bQdnuaLjA3wGeZct0A8Raih0C3juz2ouH94Sa2AZZpoR0i0Y0lRDSNVerw==
-----END PUBLIC KEY-----`,
  },
  {
    id: "p256-pkcs8",
    title: "P-256 Private Key",
    description: "PKCS#8 — kty: EC, crv: P-256",
    pem: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgLWz3dEh+tTWYZS2J
vNxJE1VNsWOOmbllhc+oOdv/avGhRANCAATQ4Ny/bZfkW9lisT5M5eBrsGkj0qxt
B2e5ouMDfAZ5ly3QDxFqKHQLeO7Pai4f3hJrYBlmmhHSLRjSVENI1V6v
-----END PRIVATE KEY-----`,
  },
  {
    id: "x509-cert",
    title: "X.509 Certificate",
    description: "Self-signed RSA certificate — extracts SPKI",
    pem: `-----BEGIN CERTIFICATE-----
MIIDGTCCAgGgAwIBAgIUR3T+gPcoRx2h7cNwRtJgK23CMegwDQYJKoZIhvcNAQEL
BQAwHDEaMBgGA1UEAwwRUEVNIHRvIEpXSyBTYW1wbGUwHhcNMjYwNTA4MjE1MzA5
WhcNMjcwNTA4MjE1MzA5WjAcMRowGAYDVQQDDBFQRU0gdG8gSldLIFNhbXBsZTCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANvCMuW5+PZojIkqhU1Va+jg
xG9wFAygZuSsiLbYRZKB0Xm8E+E0qf4zvb4nYfttlrtRKIsr04AjPl7MvtZ5xYyG
+PC0zqwrG/ClgwtuX1nbdGdatz3ytg90o6RGRtRLSyWqmUagdcG6Hrk6HRfizyMv
9VkBbEVbh3i8uZ76ofn/a5OfopQxdhsrYvRKKJ+P12tktHz8NcRpmzgeNU5e2uvI
mZOSsBHEuPe/pdwK/st6G46fwty2gNTws0jSZ64RwlvlYdQ1FFV48hrsxjfYO9tS
Lsrd/UJ3e36fPaYHBJ82gdsiJkk9iHvsj5fn3TI7rHPZAgujSEcN0d5qFxIOSBUC
AwEAAaNTMFEwHQYDVR0OBBYEFMOS61Peqws1iT19KNXt0SXueZdSMB8GA1UdIwQY
MBaAFMOS61Peqws1iT19KNXt0SXueZdSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADggEBAF2GFFe8QkIVjYUiXohgMrWaMx46SYm+/9SEVv31xQXLHF1g
fwgaSZV4+zdTSjZk1N4p8NEr8OnCj2YE5YQigO28ZZJoibR8YbcskrpBWAS3Ntxj
7hcXpEFwEcpjO6rIMoeivOWMVWPvxzJS17gHr/Ae+ZNi7fZ9+z2u7WamOGHMZJ08
xyGNyLp9YiBxeS9iPVyj58899zdbQzdtBTSsK4mQuMLM5LyhzfjL3ijqTTo6Q7QB
XCqmg9bMiX+i/gty2mNtu7vXX1viYx3kSupks3TXTurzy8ISekkzqRv8HUkwI4R1
aaPHvFpQRcJJfMtk/r+/2WP7O927QZ4MZfTiyXQ=
-----END CERTIFICATE-----`,
  },
]
